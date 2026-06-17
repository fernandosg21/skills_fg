#!/usr/bin/env python3
"""First-pass classifier for update-story communication decisions."""

from __future__ import annotations

import argparse
import json
from typing import Any


POINT_FIX_TYPES = {
    "bugfix",
    "ui-polish",
    "copy",
    "validation",
    "cache",
    "schema",
    "access-guard",
    "refactor",
    "performance",
    "deployment",
    "internal-api",
}

FEATURE_TYPES = {"feature", "workflow", "module", "integration", "report", "automation"}

TENANT_NOTICE_TYPES = {
    "billing",
    "plan",
    "permissions",
    "privacy",
    "legal",
    "migration",
    "downtime",
    "deprecation",
    "destructive",
    "outbound-automation",
    "security",
}

OPERATOR_AUDIENCES = {"saas-operator", "platform-operator", "support", "internal"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Classify a product change for update-story communication."
    )
    parser.add_argument("--summary", default="", help="Short description of the change.")
    parser.add_argument(
        "--audience",
        default="tenant-user",
        choices=[
            "tenant-user",
            "tenant-owner",
            "saas-operator",
            "platform-operator",
            "support",
            "internal",
        ],
    )
    parser.add_argument(
        "--change-type",
        default="feature",
        choices=sorted(POINT_FIX_TYPES | FEATURE_TYPES | TENANT_NOTICE_TYPES),
    )
    parser.add_argument("--user-actionable", action="store_true")
    parser.add_argument("--visible-to-tenant", action="store_true")
    parser.add_argument("--tenant-action-required", action="store_true")
    parser.add_argument("--saas-management", action="store_true")
    parser.add_argument("--many-small-fixes", action="store_true")
    return parser.parse_args()


def classify(args: argparse.Namespace) -> dict[str, Any]:
    reasons: list[str] = []

    if args.saas_management or args.audience in OPERATOR_AUDIENCES:
        reasons.append("The change belongs to SaaS/platform/internal operations.")
        return {
            "class": "operator_only",
            "surface": "operator-only release note or no tenant communication",
            "safe_for_tenant_story": False,
            "reasons": reasons,
        }

    if args.tenant_action_required or args.change_type in TENANT_NOTICE_TYPES:
        reasons.append("The change may require explicit tenant awareness or action.")
        return {
            "class": "tenant_notice",
            "surface": "direct tenant notice first; optional story only if safe and useful",
            "safe_for_tenant_story": bool(args.visible_to_tenant and args.user_actionable),
            "reasons": reasons,
        }

    if args.many_small_fixes:
        reasons.append("Several small fixes can be grouped without creating noisy slides.")
        return {
            "class": "grouped_small_fixes",
            "surface": "one generic small-fixes story",
            "safe_for_tenant_story": True,
            "reasons": reasons,
        }

    if args.change_type in POINT_FIX_TYPES:
        reasons.append("Point fixes and technical hardening usually should not become stories.")
        return {
            "class": "no_story",
            "surface": "no in-app story",
            "safe_for_tenant_story": False,
            "reasons": reasons,
        }

    if args.change_type in FEATURE_TYPES and args.visible_to_tenant and args.user_actionable:
        reasons.append("The change is a visible, user-actionable product capability.")
        return {
            "class": "individual_story",
            "surface": "tenant/user in-app stories",
            "safe_for_tenant_story": True,
            "reasons": reasons,
        }

    reasons.append("The change is not clearly visible and actionable for tenants/users.")
    return {
        "class": "no_story",
        "surface": "no in-app story unless product context says otherwise",
        "safe_for_tenant_story": False,
        "reasons": reasons,
    }


def main() -> int:
    args = parse_args()
    result = classify(args)
    result["summary"] = args.summary
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
