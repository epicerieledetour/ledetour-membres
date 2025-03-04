#!/usr/bin/env python3

import argparse
import copy
import json
import os
import urllib.request

_ENV_GOOGLE_SCRIPT_WEB_APP_URL = "LDT_MEMBRES_GOOGLE_SCRIPT_URL"
_ENV_ANONYMIZED_PATH = "LDT_MEMBRES_ANONYMIZED_PATH"
_ENV_NON_ANONYMIZED_PATH = "LDT_MEMBRES_NON_ANONYMIZED_PATH"

_DEFAULT_GOOGLE_SCRIPT_WEB_APP_URL = ""
_DEFAULT_ANONYMIZED_PATH = "members-anonymized.json"
_DEFAULT_NON_ANONYMIZED_PATH = "members-non-anonymized.json"

_FIELDS_KEEP = {"updated_at", "cycle_end", "members"}
_FIELDS_ANONYMIZED = {"active", "hours_in_bank"}
_FIELDS_NON_ANONYMIZED = {"active", "family_name", "first_name", "phone"}

def with_members_fields(data, fields, anonymized):
    data = copy.deepcopy(data)

    members = data.get("members", {})

    for member in members.values():
        filter_keys(member, fields)
    
    data["members"] = members
    data["contains_private_data"] = not anonymized

    return data

def filter_keys(data: dict, keys_to_keep: list) -> dict:
    keys_to_pop = set(data.keys()) - set(keys_to_keep)
    for key in keys_to_pop:
        data.pop(key)

def main(args):
    with urllib.request.urlopen(args.google_script_web_app_deployment_url) as fp:
        data = json.load(fp)

    filter_keys(data, _FIELDS_KEEP)

    json.dump(with_members_fields(data, _FIELDS_NON_ANONYMIZED, anonymized=False), args.non_anonymized_path)
    json.dump(with_members_fields(data, _FIELDS_ANONYMIZED, anonymized=True), args.anonymized_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build the member json")
    parser.add_argument(
        "--non-anonymized-path",
        type=argparse.FileType("w"),
        default=os.environ.get(
            _ENV_NON_ANONYMIZED_PATH,
            _DEFAULT_NON_ANONYMIZED_PATH,
        ),
    )
    parser.add_argument(
        "--anonymized-path",
        type=argparse.FileType("w"),
        default=os.environ.get(
            _ENV_ANONYMIZED_PATH,
            _DEFAULT_ANONYMIZED_PATH,
        ),
    )
    parser.add_argument(
        "--google-script-web-app-deployment-url",
        default=os.environ.get(
            _ENV_GOOGLE_SCRIPT_WEB_APP_URL,
            _DEFAULT_GOOGLE_SCRIPT_WEB_APP_URL,
        ),
    )
    args = parser.parse_args()
    main(args)
