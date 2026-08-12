---
name: manage-tenant-users-permissions
description: "Implemente ou audite usuários internos de um SaaS multi-tenant com convites, perfis, papéis, permissões backend, owner/admin/editor, sessões, troca de senha, 2FA/TOTP, reautenticação e auditoria. Use quando uma conta permite que várias pessoas operem o painel ou quando menus ocultos ainda deixam APIs acessíveis."
---

# Gerenciar usuários e permissões por tenant

## Objetivo

Permita colaboração dentro da conta sem transformar a interface em barreira de segurança. Toda autorização deve ser decidida no servidor a partir de identidade, tenant, papel, permissão e contexto da ação.

## Começar pelo mapa de autoridade

1. Liste tipos de usuário, papéis legados e ações sensíveis.
2. Mapeie páginas, APIs, jobs e downloads que dependem de permissão.
3. Defina quem é dono da conta e como a propriedade é transferida.
4. Leia [matriz-e-fluxos.md](references/matriz-e-fluxos.md).
5. Decida se o produto usa RBAC puro ou papéis mais permissões granulares.

## Modelar identidade e membership separadamente

- Mantenha a identidade global do usuário separada do vínculo com um tenant.
- Modele membership com estado, papel, data do convite, quem convidou e revogação.
- Não use e-mail sozinho como autorização; confirme o membership ativo.
- Em sistemas que permitem múltiplos tenants por usuário, exija seleção explícita e proteja troca de contexto.
- Use unicidade coerente para evitar duas memberships ativas equivalentes.

## Implementar convites seguros

1. Exija administrador autorizado e CSRF.
2. Normalize e valide o e-mail sem revelar contas de outros tenants.
3. Gere token opaco, armazene somente hash, finalidade e expiração.
4. Prenda o token ao tenant, e-mail e papel permitido.
5. Consuma-o atomicamente e invalide convites anteriores incompatíveis.
6. Se a identidade já existir, adicione apenas o vínculo autorizado.
7. Registre convite, reenvio, aceite, expiração e revogação.

## Aplicar autorização no backend

- Centralize helpers como requirePermission(tenant, user, action).
- Negue por padrão quando papel ou membership estiver ausente, suspenso ou ambíguo.
- Valide ownership do recurso além da permissão genérica.
- Aplique os mesmos gates a páginas, APIs, exportações, uploads e jobs.
- Faça menus e botões apenas refletirem a autorização efetiva.
- Responda 403 para acesso autenticado sem permissão e evite enumeração de recursos.

## Proteger ações de alto impacto

- Exija owner ou política equivalente para assinatura, segredos, transferência de propriedade e exclusões globais.
- Peça senha atual ou fator recente antes de mudar e-mail, 2FA, papéis privilegiados ou billing.
- Impeça o último owner de remover a própria capacidade sem transferência confirmada.
- Não permita elevação de privilégio pelo próprio payload do usuário.
- Revogue sessões e tokens adequados após remoção, suspensão ou incidente.

## Implementar perfil, senha e 2FA

- Permita atualizar dados pessoais sem modificar campos administrativos da conta.
- Use hash de senha forte, rehash progressivo e tokens de recuperação de uso único.
- Para TOTP, gere segredo no servidor, mostre QR uma vez, confirme um código antes de ativar e ofereça códigos de recuperação com hash.
- Proteja segredo TOTP em repouso e nunca o registre em log.
- Aplique janela pequena e proteção contra replay.
- Defina política de recuperação de 2FA com auditoria e prova reforçada.

## Manter sessões coerentes

- Regenere o ID após login, elevação ou troca de tenant.
- Guarde versão de segurança/membership para invalidar sessões após revogação.
- Limite sessões por risco e permita encerramento remoto.
- Use cookies Secure, HttpOnly e SameSite adequados.
- Não confie em papel serializado antigo na sessão sem revalidar mudanças críticas.

## Auditar

Registre ator, tenant, ação, alvo, resultado, origem, instante e diferenças sanitizadas. Não registre senha, segredo TOTP, token de convite ou sessão.

## Validar

- Convite novo, repetido, expirado, revogado e aceito duas vezes.
- Usuário existente convidado para outro tenant.
- Editor tentando acessar API administrativa diretamente.
- Admin tentando elevar a si mesmo a owner.
- Remoção de usuário com sessões ativas.
- Ativação, replay, perda e desativação de 2FA.
- Dois tenants com o mesmo e-mail convidado e IDs de recurso coincidentes.

## Critérios de conclusão

Considere pronto quando nenhuma permissão depende só da UI, convites são de uso único e tenant-scoped, ações privilegiadas exigem prova reforçada e revogações passam a valer nas sessões existentes.
