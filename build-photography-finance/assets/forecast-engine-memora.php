<?php
/**
 * Memora — Engine de previsão de faturamento (PHP puro, sem dependências).
 *
 * Técnicas implementadas:
 *  - Regressão linear OLS (tendência por mínimos quadrados);
 *  - Decomposição sazonal aditiva (offsets por posição no ciclo de 12 meses);
 *  - Suavização exponencial tripla de Holt-Winters (aditiva, com damping φ);
 *  - CAGR / CMGR (taxas de crescimento composto);
 *  - Simulação de Monte Carlo para intervalos de confiança (P10 / P50 / P90).
 *
 * A variante ADITIVA foi escolhida por robustez: faturamento de fotografia tem
 * meses de baixa temporada com R$ 0,00, o que quebra modelos multiplicativos
 * (divisão por zero / índices instáveis).
 *
 * O modelo é ADAPTATIVO ao volume de histórico disponível (nº de meses `n`):
 *   n >= 24 .... Holt-Winters (≥2 ciclos sazonais)
 *   n 12..23 ... tendência OLS + offsets sazonais de 1 ciclo
 *   n 6..11 .... melhor entre média recente, tendência amortecida e OLS,
 *                escolhido por validação temporal walk-forward
 *   n < 6 ...... projeção plana com baixa confiança (dados insuficientes)
 *
 * Nenhuma função faz I/O. Recebem séries (arrays) e devolvem arrays.
 * Requisito: a série de entrada deve ser MENSAL e CONTÍGUA (sem buracos),
 * pois o alinhamento sazonal usa a posição `t % 12`.
 */

if (!function_exists('memoraForecastAddMonths')) {

    /** Soma `k` meses a um rótulo 'YYYY-MM' (k pode ser negativo). */
    function memoraForecastAddMonths(string $ym, int $k): string
    {
        $parts = explode('-', $ym);
        $y = (int)($parts[0] ?? 0);
        $m = (int)($parts[1] ?? 1);
        $idx = ($y * 12 + ($m - 1)) + $k;
        $ny = intdiv($idx, 12);
        $nm = ($idx % 12) + 1;
        return sprintf('%04d-%02d', $ny, $nm);
    }

    /** Regressão linear OLS sobre y indexado por x = 0..n-1. */
    function memoraForecastLinearRegression(array $y): array
    {
        $n = count($y);
        if ($n < 2) {
            $mean = $n ? array_sum($y) / $n : 0.0;
            return ['slope' => 0.0, 'intercept' => $mean, 'r2' => 0.0, 'rmse' => 0.0, 'fitted' => $y];
        }
        $sx = $sy = $sxy = $sxx = 0.0;
        for ($i = 0; $i < $n; $i++) {
            $sx  += $i;
            $sy  += $y[$i];
            $sxy += $i * $y[$i];
            $sxx += $i * $i;
        }
        $den   = ($n * $sxx - $sx * $sx);
        $slope = $den != 0.0 ? ($n * $sxy - $sx * $sy) / $den : 0.0;
        $intercept = ($sy - $slope * $sx) / $n;
        $meanY = $sy / $n;
        $ssRes = 0.0;
        $ssTot = 0.0;
        $fitted = [];
        for ($i = 0; $i < $n; $i++) {
            $f = $intercept + $slope * $i;
            $fitted[] = $f;
            $ssRes += ($y[$i] - $f) ** 2;
            $ssTot += ($y[$i] - $meanY) ** 2;
        }
        $r2   = $ssTot > 0 ? max(0.0, 1 - $ssRes / $ssTot) : 0.0;
        $rmse = sqrt($ssRes / $n);
        return ['slope' => $slope, 'intercept' => $intercept, 'r2' => $r2, 'rmse' => $rmse, 'fitted' => $fitted];
    }

    /**
     * Offsets sazonais aditivos por posição no ciclo (0..period-1),
     * a partir da série e dos valores de tendência (ratio-to-trend aditivo).
     * Centralizados para somar 0.
     */
    function memoraForecastSeasonalOffsets(array $y, array $trend, int $period = 12): array
    {
        $n = count($y);
        $sums = array_fill(0, $period, 0.0);
        $cnts = array_fill(0, $period, 0);
        for ($t = 0; $t < $n; $t++) {
            $p = $t % $period;
            $sums[$p] += ($y[$t] - ($trend[$t] ?? 0.0));
            $cnts[$p]++;
        }
        $off = [];
        for ($p = 0; $p < $period; $p++) {
            $off[$p] = $cnts[$p] > 0 ? $sums[$p] / $cnts[$p] : 0.0;
        }
        $mean = array_sum($off) / $period;
        for ($p = 0; $p < $period; $p++) {
            $off[$p] -= $mean;
        }
        return $off;
    }

    /**
     * Holt-Winters aditivo (nível α, tendência β, sazonal γ) com damping φ.
     * Devolve estado final + erros in-sample (rmse de previsão um-passo-à-frente).
     */
    function memoraForecastHoltWinters(array $y, int $period, float $alpha, float $beta, float $gamma, float $phi = 1.0): array
    {
        $n = count($y);
        if ($n < 2 * $period) {
            return ['ok' => false];
        }

        // Inicialização (Hyndman): nível = média do 1º ciclo; tendência = média
        // das diferenças entre o 2º e o 1º ciclo; sazonal = desvio do 1º ciclo.
        $level = array_sum(array_slice($y, 0, $period)) / $period;
        $sumT = 0.0;
        for ($i = 0; $i < $period; $i++) {
            $sumT += ($y[$period + $i] - $y[$i]);
        }
        $trend = $sumT / ($period * $period);

        $S = [];
        for ($i = 0; $i < $period; $i++) {
            $S[$i] = $y[$i] - $level;
        }
        $sm = array_sum($S) / $period;
        for ($i = 0; $i < $period; $i++) {
            $S[$i] -= $sm;
        }

        $fitted = array_fill(0, $n, null);
        $sse = 0.0;
        $cntErr = 0;
        $prevLevel = $level;
        $prevTrend = $trend;

        for ($t = 0; $t < $n; $t++) {
            $p = $t % $period;
            $sPrev = $S[$p];
            $oneStep = $prevLevel + $phi * $prevTrend + $sPrev;
            if ($t >= $period) {
                $fitted[$t] = $oneStep;
                $sse += ($y[$t] - $oneStep) ** 2;
                $cntErr++;
            }
            $newLevel  = $alpha * ($y[$t] - $sPrev) + (1 - $alpha) * ($prevLevel + $phi * $prevTrend);
            $newTrend  = $beta * ($newLevel - $prevLevel) + (1 - $beta) * $phi * $prevTrend;
            $newSeason = $gamma * ($y[$t] - $newLevel) + (1 - $gamma) * $sPrev;
            $S[$p]     = $newSeason;
            $prevLevel = $newLevel;
            $prevTrend = $newTrend;
        }

        $rmse = $cntErr > 0 ? sqrt($sse / $cntErr) : 0.0;
        return [
            'ok'     => true,
            'level'  => $prevLevel,
            'trend'  => $prevTrend,
            'season' => $S,
            'phi'    => $phi,
            'period' => $period,
            'sse'    => $sse,
            'rmse'   => $rmse,
            'fitted' => $fitted,
            'n'      => $n,
        ];
    }

    /** Busca em grade dos parâmetros de Holt-Winters minimizando o SSE in-sample. */
    function memoraForecastTuneHoltWinters(array $y, int $period): array
    {
        $grid = [0.1, 0.3, 0.5, 0.7, 0.9];
        $phis = [1.0, 0.95, 0.85];
        $best = null;
        foreach ($grid as $a) {
            foreach ($grid as $b) {
                foreach ($grid as $g) {
                    foreach ($phis as $phi) {
                        $r = memoraForecastHoltWinters($y, $period, $a, $b, $g, $phi);
                        if (empty($r['ok'])) {
                            continue;
                        }
                        if ($best === null || $r['sse'] < $best['sse']) {
                            $best = $r + ['alpha' => $a, 'beta' => $b, 'gamma' => $g];
                        }
                    }
                }
            }
        }
        return $best ?? ['ok' => false];
    }

    /** Projeta `horizon` meses à frente a partir do estado de Holt-Winters. */
    function memoraForecastHoltWintersProject(array $hw, int $horizon): array
    {
        $out    = [];
        $level  = $hw['level'];
        $trend  = $hw['trend'];
        $phi    = $hw['phi'];
        $period = $hw['period'];
        $S      = $hw['season'];
        $n      = $hw['n'];
        $coef   = 0.0;
        $pw     = 1.0;
        for ($h = 1; $h <= $horizon; $h++) {
            $pw  *= $phi;           // φ^h
            $coef += $pw;           // Σ φ^i (i = 1..h) — vira h quando φ = 1
            $p    = ($n + $h - 1) % $period;
            $val  = $level + $coef * $trend + $S[$p];
            $out[] = max(0.0, $val);
        }
        return $out;
    }

    /** CMGR (composto mensal) e CAGR, suavizando pontas com média de k meses. */
    function memoraForecastGrowthRates(array $y): array
    {
        $n = count($y);
        if ($n < 4) {
            return ['cmgr' => 0.0, 'cagr' => 0.0];
        }
        $k = max(1, min(3, intdiv($n, 4)));
        $startAvg = array_sum(array_slice($y, 0, $k)) / $k;
        $endAvg   = array_sum(array_slice($y, $n - $k, $k)) / $k;
        $months   = $n - $k;
        if ($startAvg <= 0 || $endAvg <= 0 || $months <= 0) {
            return ['cmgr' => 0.0, 'cagr' => 0.0];
        }
        $cmgr = pow($endAvg / $startAvg, 1.0 / $months) - 1.0;
        $cagr = pow(1.0 + $cmgr, 12) - 1.0;
        return ['cmgr' => $cmgr, 'cagr' => $cagr];
    }

    /** Amostra normal padrão (Box-Muller). */
    function memoraForecastGaussian(): float
    {
        $u1 = (mt_rand() + 1.0) / (mt_getrandmax() + 2.0);
        $u2 = (mt_rand() + 0.0) / (mt_getrandmax() + 1.0);
        return sqrt(-2.0 * log($u1)) * cos(2.0 * M_PI * $u2);
    }

    /** Uniforme reproduzível com estado local (Park-Miller). */
    function memoraForecastDeterministicUniform(int &$state): float
    {
        $state = (int)(($state * 48271) % 2147483647);
        if ($state <= 0) {
            $state = 1;
        }
        return $state / 2147483647;
    }

    /** Normal padrão com estado local reproduzível, sem alterar o RNG global do request. */
    function memoraForecastDeterministicGaussian(int &$state): float
    {
        $u1 = max(1.0e-12, memoraForecastDeterministicUniform($state));
        $u2 = memoraForecastDeterministicUniform($state);
        return sqrt(-2.0 * log($u1)) * cos(2.0 * M_PI * $u2);
    }

    /** Percentil (0..1) de um vetor; ordena uma cópia. */
    function memoraForecastPercentile(array $arr, float $p): float
    {
        $n = count($arr);
        if ($n === 0) {
            return 0.0;
        }
        sort($arr, SORT_NUMERIC);
        $idx = (int) round($p * ($n - 1));
        if ($idx < 0) {
            $idx = 0;
        }
        if ($idx >= $n) {
            $idx = $n - 1;
        }
        return (float) $arr[$idx];
    }

    /**
     * Monte Carlo: propaga incerteza mês a mês como passeio aleatório no nível
     * (a banda alarga ~√h) somado a ruído observacional, com piso em 0.
     * Devolve percentis por mês e por agregado (trimestre/semestre/ano).
     *
     * @param float[] $point   previsão pontual por mês
     * @param array   $aggDefs ['trimestre'=>3,'semestre'=>6,'ano'=>12]
     * @param array|null $bases base de comparação por agregado (mesmo período do ano anterior)
     */
    function memoraForecastMonteCarlo(array $point, float $sigma, array $aggDefs, ?array $bases = null, int $sims = 3000, array $floors = [], int $seed = 1): array
    {
        $H = count($point);
        if ($H === 0) {
            return ['mensal' => [], 'horizontes' => []];
        }
        if ($sigma < 0) {
            $sigma = 0.0;
        }

        $monthSamples = array_fill(0, $H, []);
        $aggSamples   = [];
        foreach ($aggDefs as $name => $mlen) {
            $aggSamples[$name] = [];
        }

        $rngState = max(1, $seed % 2147483647);
        for ($s = 0; $s < $sims; $s++) {
            $acc  = 0.0;
            $path = [];
            for ($h = 0; $h < $H; $h++) {
                $acc += memoraForecastDeterministicGaussian($rngState) * $sigma;          // passeio no nível
                $obs  = memoraForecastDeterministicGaussian($rngState) * $sigma * 0.5;    // ruído observacional
                $v    = $point[$h] + $acc + $obs;
                $v    = max((float)($floors[$h] ?? 0.0), $v, 0.0);
                $path[$h] = $v;
                $monthSamples[$h][] = $v;
            }
            foreach ($aggDefs as $name => $mlen) {
                $sum = 0.0;
                for ($h = 0; $h < $mlen && $h < $H; $h++) {
                    $sum += $path[$h];
                }
                $aggSamples[$name][] = $sum;
            }
        }

        $mensal = [];
        for ($h = 0; $h < $H; $h++) {
            $mensal[] = [
                'p10' => memoraForecastPercentile($monthSamples[$h], 0.10),
                'p50' => memoraForecastPercentile($monthSamples[$h], 0.50),
                'p90' => memoraForecastPercentile($monthSamples[$h], 0.90),
            ];
        }

        $horizontes = [];
        foreach ($aggDefs as $name => $mlen) {
            $arr = $aggSamples[$name];
            $h = [
                'p10' => memoraForecastPercentile($arr, 0.10),
                'p50' => memoraForecastPercentile($arr, 0.50),
                'p90' => memoraForecastPercentile($arr, 0.90),
            ];
            $base = ($bases !== null && isset($bases[$name])) ? $bases[$name] : null;
            if ($base !== null && $base > 0) {
                $cnt = 0;
                foreach ($arr as $v) {
                    if ($v > $base) {
                        $cnt++;
                    }
                }
                $h['base_anterior']     = $base;
                $h['crescimento_pct']   = null; // preenchido no build com p50 determinístico
                $h['prob_superar_base'] = (int) round($cnt / max(1, count($arr)) * 100);
            } else {
                $h['base_anterior']     = null;
                $h['crescimento_pct']   = null;
                $h['prob_superar_base'] = null;
            }
            $horizontes[$name] = $h;
        }

        return ['mensal' => $mensal, 'horizontes' => $horizontes];
    }

    /** Projeção simples por média dos três meses mais recentes. */
    function memoraForecastRecentMean(array $y, int $horizon): array
    {
        $n = count($y);
        $k = min(3, $n);
        $level = $k > 0 ? array_sum(array_slice($y, -$k)) / $k : 0.0;
        return array_fill(0, max(0, $horizon), max(0.0, $level));
    }

    /** Tendência amortecida: reage ao crescimento sem extrapolá-lo indefinidamente. */
    function memoraForecastDampedTrend(array $y, int $horizon, float $phi = 0.65): array
    {
        $n = count($y);
        $reg = memoraForecastLinearRegression($y);
        $k = min(3, $n);
        $level = $k > 0 ? array_sum(array_slice($y, -$k)) / $k : 0.0;
        $reference = max(1.0, $level, $n > 0 ? array_sum($y) / $n : 0.0);
        $maxSlope = 0.20 * $reference;
        $slope = max(-$maxSlope, min($maxSlope, (float)$reg['slope']));
        $out = [];
        $coef = 0.0;
        $power = 1.0;
        for ($h = 1; $h <= $horizon; $h++) {
            $power *= $phi;
            $coef += $power;
            $out[] = max(0.0, $level + $slope * $coef);
        }
        return $out;
    }

    /** Projeta um candidato curto sem chamar o orquestrador (evita viés e recursão). */
    function memoraForecastShortCandidate(array $y, string $candidate, int $horizon): array
    {
        if ($candidate === 'media-recente') {
            return memoraForecastRecentMean($y, $horizon);
        }
        if ($candidate === 'tendencia-amortecida') {
            return memoraForecastDampedTrend($y, $horizon);
        }
        $reg = memoraForecastLinearRegression($y);
        $out = [];
        $n = count($y);
        for ($h = 1; $h <= $horizon; $h++) {
            $idx = $n - 1 + $h;
            $out[] = max(0.0, $reg['intercept'] + $reg['slope'] * $idx);
        }
        return $out;
    }

    /**
     * Validação temporal walk-forward. Cada previsão usa somente os meses anteriores,
     * e o WAPE evita que meses com receita pequena ou zero dominem a avaliação.
     */
    function memoraForecastBacktestCandidate(array $y, string $candidate, int $minTrain = 3, int $maxTests = 12): array
    {
        $n = count($y);
        $start = max($minTrain, $n - max(1, $maxTests));
        $absError = 0.0;
        $actualTotal = 0.0;
        $sqError = 0.0;
        $smapeTotal = 0.0;
        $tests = 0;
        for ($cut = $start; $cut < $n; $cut++) {
            $train = array_slice($y, 0, $cut);
            $projection = memoraForecastShortCandidate($train, $candidate, 1);
            $pred = max(0.0, (float)($projection[0] ?? 0.0));
            $actual = max(0.0, (float)$y[$cut]);
            $error = abs($actual - $pred);
            $absError += $error;
            $actualTotal += $actual;
            $sqError += $error ** 2;
            $den = abs($actual) + abs($pred);
            $smapeTotal += $den > 0 ? (2 * $error / $den) : 0.0;
            $tests++;
        }
        return [
            'tests' => $tests,
            'wape' => ($tests > 0 && $actualTotal > 0) ? $absError / $actualTotal : null,
            'smape' => $tests > 0 ? $smapeTotal / $tests : null,
            'mae' => $tests > 0 ? $absError / $tests : null,
            'rmse' => $tests > 0 ? sqrt($sqError / $tests) : null,
        ];
    }

    /** Escolhe o candidato de curto histórico pelo menor erro fora da amostra. */
    function memoraForecastSelectShortModel(array $y): array
    {
        $candidates = ['media-recente', 'tendencia-amortecida', 'regressao-linear'];
        $best = null;
        foreach ($candidates as $candidate) {
            $metrics = memoraForecastBacktestCandidate($y, $candidate);
            $score = $metrics['wape'] ?? INF;
            if ($best === null || $score < $best['score'] - 0.005) {
                $best = ['metodo' => $candidate, 'metricas' => $metrics, 'score' => $score];
            }
        }
        return $best ?? ['metodo' => 'media-recente', 'metricas' => memoraForecastBacktestCandidate($y, 'media-recente')];
    }

    /** Benchmark temporal sazonal: compara cada mês com o mesmo mês do ano anterior. */
    function memoraForecastBacktestSeasonal(array $y, int $period = 12, int $maxTests = 12): array
    {
        $n = count($y);
        $start = max($period, $n - max(1, $maxTests));
        $absError = $actualTotal = $sqError = $smapeTotal = 0.0;
        $tests = 0;
        for ($i = $start; $i < $n; $i++) {
            $actual = max(0.0, (float)$y[$i]);
            $pred = max(0.0, (float)$y[$i - $period]);
            $error = abs($actual - $pred);
            $absError += $error;
            $actualTotal += $actual;
            $sqError += $error ** 2;
            $den = abs($actual) + abs($pred);
            $smapeTotal += $den > 0 ? (2 * $error / $den) : 0.0;
            $tests++;
        }
        return [
            'tests' => $tests,
            'wape' => ($tests > 0 && $actualTotal > 0) ? $absError / $actualTotal : null,
            'smape' => $tests > 0 ? $smapeTotal / $tests : null,
            'mae' => $tests > 0 ? $absError / $tests : null,
            'rmse' => $tests > 0 ? sqrt($sqError / $tests) : null,
        ];
    }

    /**
     * Orquestrador principal.
     *
     * @param array  $series      [['mes'=>'YYYY-MM','receita'=>float], ...] contígua, asc.
     * @param string $anchorMonth último mês REAL ('YYYY-MM'); previsão começa em +1.
     * @param int    $horizon     meses à frente (default 12).
     * @param array  $knownFuture receita já contratada por 'YYYY-MM', usada só como piso.
     */
    function memoraForecastBuild(array $series, string $anchorMonth, int $horizon = 12, array $knownFuture = []): array
    {
        $period  = 12;
        $mapHist = [];
        $y = [];
        foreach ($series as $row) {
            $val = (float)($row['receita'] ?? 0);
            $y[] = $val;
            if (isset($row['mes'])) {
                $mapHist[$row['mes']] = $val;
            }
        }
        $n     = count($y);
        $total = array_sum($y);

        // ---- Tier por volume de dados ----
        if ($n < 3 || $total <= 0) {
            $metodo = 'insuficiente';
        } elseif ($n < 6) {
            $metodo = 'preliminar';          // 3–5 meses: estimativa conservadora
        } elseif ($n >= 2 * $period) {
            $metodo = 'holt-winters';
        } elseif ($n >= $period) {
            $metodo = 'holt-sazonal';
        } else {
            $selection = memoraForecastSelectShortModel($y);
            $metodo = (string)$selection['metodo'];
        }

        $point  = [];
        $fitted = array_fill(0, $n, null);
        $sigma  = 0.0;
        $hwParams = null;

        if ($metodo === 'holt-winters') {
            $hw = memoraForecastTuneHoltWinters($y, $period);
            if (!empty($hw['ok'])) {
                $point    = memoraForecastHoltWintersProject($hw, $horizon);
                $fitted   = $hw['fitted'];
                $sigma    = $hw['rmse'];
                $hwParams = ['alpha' => $hw['alpha'], 'beta' => $hw['beta'], 'gamma' => $hw['gamma'], 'phi' => $hw['phi']];
            } else {
                $metodo = 'holt-sazonal'; // fallback defensivo
            }
        }

        if ($metodo === 'holt-sazonal') {
            $reg   = memoraForecastLinearRegression($y);
            $trendVals = $reg['fitted'];
            $offs  = memoraForecastSeasonalOffsets($y, $trendVals, $period);
            for ($i = 0; $i < $n; $i++) {
                $fitted[$i] = max(0.0, $trendVals[$i] + $offs[$i % $period]);
            }
            for ($h = 1; $h <= $horizon; $h++) {
                $idx = $n - 1 + $h;
                $tv  = $reg['intercept'] + $reg['slope'] * $idx;
                $point[] = max(0.0, $tv + $offs[$idx % $period]);
            }
            $sigma = memoraForecastSeriesRmse($y, $fitted);
        } elseif (in_array($metodo, ['media-recente', 'tendencia-amortecida', 'regressao-linear'], true)) {
            $reg = memoraForecastLinearRegression($y);
            for ($i = 0; $i < $n; $i++) {
                $fitted[$i] = max(0.0, $reg['fitted'][$i]);
            }
            $point = memoraForecastShortCandidate($y, $metodo, $horizon);
            $sigma = $reg['rmse'];
        } elseif ($metodo === 'preliminar') {
            // 3–5 meses: modelo "pé no chão" — nível recente + tendência
            // fortemente amortecida (φ=0.6, sem sazonalidade) para não
            // extrapolar demais, com banda de incerteza propositalmente larga.
            $recentK = min(3, $n);
            $baseLevel = array_sum(array_slice($y, $n - $recentK, $recentK)) / $recentK;
            $reg = memoraForecastLinearRegression($y);
            for ($i = 0; $i < $n; $i++) {
                $fitted[$i] = max(0.0, $reg['fitted'][$i]);
            }
            $point = memoraForecastDampedTrend($y, $horizon, 0.6);
            // incerteza conservadora: piso de 15% do nível recente
            $sigma = max(memoraForecastStdDev($y), 0.15 * $baseLevel);
        } elseif ($metodo === 'insuficiente') {
            $mean = $n > 0 ? $total / $n : 0.0;
            for ($h = 1; $h <= $horizon; $h++) {
                $point[] = $mean;
            }
            $sigma = memoraForecastStdDev($y);
        }

        // ---- Bases de comparação (mesmo mês do ano anterior) ----
        $forecastMonths = [];
        for ($h = 1; $h <= $horizon; $h++) {
            $forecastMonths[] = memoraForecastAddMonths($anchorMonth, $h);
        }
        $floors = [];
        foreach ($forecastMonths as $idx => $month) {
            $floors[$idx] = max(0.0, (float)($knownFuture[$month] ?? 0.0));
            $point[$idx] = max((float)($point[$idx] ?? 0.0), $floors[$idx]);
        }
        $aggDefs = ['trimestre' => 3, 'semestre' => 6, 'ano' => 12];
        $bases = [];
        foreach ($aggDefs as $name => $mlen) {
            $sum = 0.0;
            $complete = true;
            for ($h = 0; $h < $mlen && $h < $horizon; $h++) {
                $baseMonth = memoraForecastAddMonths($forecastMonths[$h], -12);
                if (array_key_exists($baseMonth, $mapHist)) {
                    $sum += $mapHist[$baseMonth];
                } else {
                    $complete = false;
                    break;
                }
            }
            $bases[$name] = $complete ? $sum : null;
        }

        // ---- Monte Carlo ----
        $backtest = $n >= $period
            ? memoraForecastBacktestSeasonal($y, $period)
            : memoraForecastBacktestCandidate($y, $metodo === 'preliminar' ? 'tendencia-amortecida' : $metodo);
        if (($backtest['rmse'] ?? null) !== null && (int)($backtest['tests'] ?? 0) >= 3) {
            $sigma = max(0.0, (float)$backtest['rmse']);
        }
        $seed = (int)sprintf('%u', crc32(json_encode([$anchorMonth, $y, $point, $floors])));
        $mc = memoraForecastMonteCarlo($point, $sigma, $aggDefs, $bases, 3000, $floors, max(1, $seed));

        // ---- P50 determinístico (soma da previsão pontual) + clamp das bandas ----
        $forecastMensal = [];
        for ($h = 0; $h < $horizon; $h++) {
            $p50 = $point[$h];
            $p10 = min($mc['mensal'][$h]['p10'], $p50);
            $p90 = max($mc['mensal'][$h]['p90'], $p50);
            $forecastMensal[] = [
                'mes' => $forecastMonths[$h],
                'p10' => round($p10, 2),
                'p50' => round($p50, 2),
                'p90' => round($p90, 2),
                'ja_contratado' => round($floors[$h] ?? 0.0, 2),
            ];
        }

        $horizontes = [];
        foreach ($aggDefs as $name => $mlen) {
            $detP50 = 0.0;
            for ($h = 0; $h < $mlen && $h < $horizon; $h++) {
                $detP50 += $point[$h];
            }
            $mcH = $mc['horizontes'][$name];
            $p10 = min($mcH['p10'], $detP50);
            $p90 = max($mcH['p90'], $detP50);
            $base = $mcH['base_anterior'];
            $horizontes[$name] = [
                'p10'               => round($p10, 2),
                'p50'               => round($detP50, 2),
                'p90'               => round($p90, 2),
                'base_anterior'     => $base !== null ? round($base, 2) : null,
                'crescimento_pct'   => ($base !== null && $base > 0) ? round((($detP50 - $base) / $base) * 100, 1) : null,
                'prob_superar_base' => $mcH['prob_superar_base'],
            ];
        }

        // ---- Sazonalidade aparente (pico/vale) nos próximos 12 meses ----
        $picoIdx = 0;
        $valeIdx = 0;
        for ($h = 0; $h < $horizon; $h++) {
            if ($point[$h] > $point[$picoIdx]) {
                $picoIdx = $h;
            }
            if ($point[$h] < $point[$valeIdx]) {
                $valeIdx = $h;
            }
        }

        // ---- Confiança baseada em evidência fora da amostra ----
        $wape = $backtest['wape'] ?? null;
        $tests = (int)($backtest['tests'] ?? 0);
        $relativeWidths = [];
        for ($h = 0; $h < min(3, count($forecastMensal)); $h++) {
            $central = max(1.0, (float)$forecastMensal[$h]['p50']);
            $relativeWidths[] = max(0.0, ((float)$forecastMensal[$h]['p90'] - (float)$forecastMensal[$h]['p10']) / $central);
        }
        $intervalRatio = $relativeWidths ? array_sum($relativeWidths) / count($relativeWidths) : null;
        $accuracyScore = $wape !== null ? max(0.0, 100.0 - min(100.0, $wape * 140.0)) : 0.0;
        $historyScore = min(100.0, ($n / 18.0) * 100.0);
        $testsScore = min(100.0, ($tests / 6.0) * 100.0);
        $precisionScore = $intervalRatio !== null ? max(0.0, 100.0 - min(100.0, $intervalRatio * 66.7)) : 0.0;
        $confidenceScore = (int)round(0.50 * $accuracyScore + 0.20 * $historyScore + 0.20 * $testsScore + 0.10 * $precisionScore);
        if ($metodo === 'insuficiente') {
            $confidenceScore = 0;
        }
        $nivel = 'baixa';
        if ($metodo !== 'insuficiente') {
            if ($n >= 18 && $tests >= 6 && $wape !== null && $wape <= 0.22 && $confidenceScore >= 75) {
                $nivel = 'alta';
            } elseif ($n >= 6 && $tests >= 3 && $wape !== null && $wape <= 0.45 && $confidenceScore >= 48) {
                $nivel = 'media';
            }
        }

        $forecastQuarter = array_sum(array_slice($point, 0, min(3, count($point))));
        $contractedQuarter = array_sum(array_slice($floors, 0, min(3, count($floors))));
        $contractedCoverage = $forecastQuarter > 0 ? min(1.0, $contractedQuarter / $forecastQuarter) : 0.0;

        $growth = memoraForecastGrowthRates($y);
        if (in_array($metodo, ['media-recente', 'tendencia-amortecida', 'regressao-linear', 'preliminar'], true)) {
            $recentK = min(3, $n);
            $recentBase = $recentK > 0 ? array_sum(array_slice($y, -$recentK)) / $recentK : 0.0;
            $growthHorizon = min(3, count($point));
            $growthTarget = $growthHorizon > 0 ? (float)$point[$growthHorizon - 1] : $recentBase;
            if ($recentBase > 0 && $growthTarget > 0 && $growthHorizon > 0) {
                $shortCmgr = pow($growthTarget / $recentBase, 1.0 / $growthHorizon) - 1.0;
                $growth = ['cmgr' => $shortCmgr, 'cagr' => pow(1.0 + $shortCmgr, 12) - 1.0];
            }
        }

        return [
            'metodo'          => $metodo,
            'meses_dados'     => $n,
            'anchor'          => $anchorMonth,
            'forecast_mensal' => $forecastMensal,
            'horizontes'      => $horizontes,
            'crescimento'     => [
                'cmgr_pct' => round($growth['cmgr'] * 100, 2),
                'cagr_pct' => round($growth['cagr'] * 100, 2),
            ],
            'sazonalidade'    => [
                'pico_mes' => $forecastMonths[$picoIdx] ?? null,
                'vale_mes' => $forecastMonths[$valeIdx] ?? null,
            ],
            'confianca'       => [
                'nivel'       => $nivel,
                'score'       => $confidenceScore,
                'wape'        => $wape !== null ? round($wape * 100, 1) : null,
                'mape'        => $wape !== null ? round($wape * 100, 1) : null,
                'testes'      => $tests,
                'largura_relativa_pct' => $intervalRatio !== null ? round($intervalRatio * 100, 1) : null,
                'cobertura_contratada_trimestre_pct' => round($contractedCoverage * 100, 1),
                'meses_dados' => $n,
            ],
            'params'          => $hwParams,
        ];
    }

    /** RMSE entre série e valores ajustados (ignora posições null). */
    function memoraForecastSeriesRmse(array $y, array $fitted): float
    {
        $sse = 0.0;
        $cnt = 0;
        $n = count($y);
        for ($i = 0; $i < $n; $i++) {
            if (!isset($fitted[$i]) || $fitted[$i] === null) {
                continue;
            }
            $sse += ($y[$i] - $fitted[$i]) ** 2;
            $cnt++;
        }
        return $cnt > 0 ? sqrt($sse / $cnt) : 0.0;
    }

    /** Desvio-padrão populacional. */
    function memoraForecastStdDev(array $y): float
    {
        $n = count($y);
        if ($n === 0) {
            return 0.0;
        }
        $mean = array_sum($y) / $n;
        $acc = 0.0;
        foreach ($y as $v) {
            $acc += ($v - $mean) ** 2;
        }
        return sqrt($acc / $n);
    }

    /** MAPE in-sample sobre meses com receita > 0 (null se não computável). */
    function memoraForecastMape(array $y, array $fitted): ?float
    {
        $acc = 0.0;
        $cnt = 0;
        $n = count($y);
        for ($i = 0; $i < $n; $i++) {
            if (!isset($fitted[$i]) || $fitted[$i] === null || $y[$i] <= 0) {
                continue;
            }
            $acc += abs($y[$i] - $fitted[$i]) / $y[$i];
            $cnt++;
        }
        return $cnt > 0 ? ($acc / $cnt) : null;
    }
}
