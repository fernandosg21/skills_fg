#!/usr/bin/env python3
"""Compare real target-adapter results with the synthetic Memora finance oracle."""
import argparse
import copy
import json
import sys
from pathlib import Path


def unique_object(pairs):
    obj = {}
    for key, value in pairs:
        if key in obj:
            raise ValueError(f"Chave JSON duplicada: {key}")
        obj[key] = value
    return obj


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8-sig"),
                      object_pairs_hook=unique_object)


def case_map(document, payload_key):
    if type(document.get("schema_version")) is not int or document.get("schema_version") != 1 or document.get("currency") != "BRL":
        raise ValueError("schema_version=1 e currency=BRL são obrigatórios.")
    cases = document.get("cases")
    if not isinstance(cases, list) or not cases:
        raise ValueError("cases deve ser uma lista não vazia.")
    result = {}
    for case in cases:
        ident = case.get("id") if isinstance(case, dict) else None
        if not isinstance(ident, str) or not ident or ident in result:
            raise ValueError(f"ID de caso inválido/duplicado: {ident!r}")
        payload = case.get(payload_key)
        if not isinstance(payload, dict) or not payload:
            raise ValueError(f"{ident}: {payload_key} deve ser objeto não vazio.")
        result[ident] = payload
    return result


def compare_value(expected, actual, path, errors):
    if type(expected) is not type(actual):
        errors.append(f"{path}: tipo {type(actual).__name__}; esperado {type(expected).__name__}")
    elif isinstance(expected, dict):
        for key, value in expected.items():
            if key not in actual:
                errors.append(f"{path}.{key}: ausente")
            else:
                compare_value(value, actual[key], f"{path}.{key}", errors)
    elif isinstance(expected, list):
        if len(expected) != len(actual):
            errors.append(f"{path}: tamanho {len(actual)}; esperado {len(expected)}")
        else:
            for index, (exp, act) in enumerate(zip(expected, actual)):
                compare_value(exp, act, f"{path}[{index}]", errors)
    elif expected != actual:
        errors.append(f"{path}: {actual!r}; esperado {expected!r}")


def compare_documents(fixture, actual):
    oracle = case_map(fixture, "expected")
    output = case_map(actual, "actual")
    errors = [f"Caso ausente: {ident}" for ident in sorted(oracle.keys() - output.keys())]
    errors += [f"Caso desconhecido: {ident}" for ident in sorted(output.keys() - oracle.keys())]
    for ident in oracle.keys() & output.keys():
        compare_value(oracle[ident], output[ident], ident, errors)
    return errors


def check_fixture(fixture):
    case_map(fixture, "expected")
    for case in fixture["cases"]:
        if not isinstance(case.get("given"), list) or not case["given"]:
            raise ValueError(f"{case['id']}: faltam condições/operações do cenário.")
        for key, value in case["expected"].items():
            if key.endswith("_cents") and type(value) is not int:
                raise ValueError(f"{case['id']}.{key}: centavos devem ser inteiros.")
    return len(fixture["cases"])


def self_test(fixture):
    actual = {"schema_version": 1, "currency": "BRL", "cases": [
        {"id": item["id"], "actual": copy.deepcopy(item["expected"])}
        for item in fixture["cases"]]}
    assert not compare_documents(fixture, actual)
    bad = copy.deepcopy(actual)
    key = next(key for key, value in bad["cases"][0]["actual"].items() if type(value) is int)
    bad["cases"][0]["actual"][key] += 1
    assert compare_documents(fixture, bad)
    bad["cases"][0]["actual"][key] = str(actual["cases"][0]["actual"][key])
    assert compare_documents(fixture, bad)
    bad = copy.deepcopy(actual)
    del bad["cases"][0]["actual"][key]
    assert compare_documents(fixture, bad)
    bad = copy.deepcopy(actual)
    bad["cases"].pop()
    assert compare_documents(fixture, bad)
    for mutated in (
        {**actual, "currency": "USD"},
        {**actual, "cases": actual["cases"] + [actual["cases"][0]]},
    ):
        try:
            compare_documents(fixture, mutated)
        except ValueError:
            pass
        else:
            raise AssertionError("Entrada inválida aceita pelo comparador")
    try:
        json.loads('{"id":1,"id":2}', object_pairs_hook=unique_object)
    except ValueError:
        pass
    else:
        raise AssertionError("Chave JSON duplicada aceita")
    return 8


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fixture", type=Path, default=Path(__file__).resolve().parents[1] / "assets" / "cenarios-reconciliacao.json")
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--actual", type=Path)
    modes.add_argument("--check-fixture", action="store_true")
    modes.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    try:
        fixture = read_json(args.fixture)
        count = check_fixture(fixture)
        if args.check_fixture:
            print(f"Fixture válido: {count} cenários sintéticos. Alvo não homologado.")
        elif args.self_test:
            print(f"Comparador validado: {self_test(fixture)} verificações. Alvo não homologado.")
        else:
            errors = compare_documents(fixture, read_json(args.actual))
            if errors:
                print("Falha de paridade:\n" + "\n".join(errors), file=sys.stderr)
                return 1
            print(f"Resultados informados coincidem: {count} cenários. Confira a evidência de execução do adaptador.")
    except (ValueError, TypeError, AttributeError, KeyError, OSError) as exc:
        print(f"Entrada inválida: {exc}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
