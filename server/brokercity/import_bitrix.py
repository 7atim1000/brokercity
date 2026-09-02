# crm/management/commands/import_bitrix.py
import json
import csv
from django.core.management.base import BaseCommand
from django.db import transaction
from .models import Company, Contact, Lead, Deal

MODEL_MAP = {
    "companies": Company,
    "contacts": Contact,
    "leads": Lead,
    "deals": Deal,
}

class Command(BaseCommand):
    help = "Import Bitrix24 export (JSON or CSV) into Django models"

    def add_arguments(self, parser):
        parser.add_argument("entity", choices=MODEL_MAP.keys())
        parser.add_argument("file_path")

    def handle(self, *args, **options):
        entity = options["entity"]
        path = options["file_path"]
        model = MODEL_MAP[entity]

        rows = self._load(path)
        created, updated = 0, 0

        with transaction.atomic():
            for row in rows:
                defaults = self._map_fields(entity, row)
                obj, was_created = model.objects.update_or_create(
                    bitrix_id=row["ID"],
                    defaults={**defaults, "raw_data": row},
                )
                created += was_created
                updated += not was_created

        self.stdout.write(self.style.SUCCESS(f"{entity}: {created} created, {updated} updated"))

    def _load(self, path):
        if path.endswith(".json"):
            with open(path, encoding="utf-8-sig") as f:
                return json.load(f)
            with open(path, encoding="utf-8-sig", newline="") as f:
               return list(csv.DictReader(f, delimiter=";"))

    def _map_fields(self, entity, row):
        # Map Bitrix field names -> Django field names per entity.
        # Adjust to match your actual export field names.
        if entity == "companies":
            return {"title": row.get("TITLE", "")}
        if entity == "contacts":
            return {"name": row.get("NAME", ""), "last_name": row.get("LAST_NAME", "")}
        if entity == "leads":
            return {"title": row.get("TITLE", "")}
        if entity == "deals":
            return {"title": row.get("TITLE", "")}
        return {}

     
    # companies
    def _map_fields(self, entity, row):
        if entity == "companies":
            return {
                "title": row.get("Company Name", ""),
                "company_type": row.get("Company Type", ""),
                "industry": row.get("Industry", ""),
                "revenue": self._parse_decimal(row.get("Annual Income")),
                "currency": row.get("Currency", ""),
                "phone": row.get("Work Phone") or row.get("Mobile", ""),
                "email": row.get("Work E-mail", ""),
                "website": row.get("Corporate Website", ""),
                "comments": row.get("Comment", ""),
        }
        if entity == "contacts":
           return {"name": row.get("NAME", ""), "last_name": row.get("LAST_NAME", "")}
        if entity == "leads":
            return {"title": row.get("TITLE", "")}
        if entity == "deals":
            return {"title": row.get("TITLE", "")}
        return {}

    def _parse_decimal(self, value):
        if not value:
            return None
        try:
            return float(str(value).replace(",", "").strip())
        except ValueError:
            return None
    
    # STEPS
    # Here's the concrete path to get that CSV into brokercity's Postgres DB.
    ########################
    # 1. Inspect the actual CSV columns first
    ########################
    # Before touching code, open the CSV and check its real header row — Bitrix export headers rarely match the REST API field names exactly.
    # bash(Terminal)
    # Get-Content brokercity\data_imports\companies.csv -TotalCount 1
    # RESULT : open xsl sheet determines HEADERS
    # You'll likely see something like:
    # ID,COMPANY_TITLE,COMPANY_TYPE,PHONE,EMAIL,WEBSITE,ADDRESS,LOGO,DATE_CREATE,DATE_MODIFY,ASSIGNED_BY_ID
    
    # 1.1 Update _map_fields for the real header names
#     def _map_fields(self, entity, row):
#     if entity == "companies":
#         return {
#             "title": row.get("Company Name", ""),
#             "company_type": row.get("Company Type", ""),
#             "industry": row.get("Industry", ""),
#             "revenue": self._parse_decimal(row.get("Annual Income")),
#             "currency": row.get("Currency", ""),
#             "phone": row.get("Work Phone") or row.get("Mobile", ""),
#             "email": row.get("Work E-mail", ""),
#             "website": row.get("Corporate Website", ""),
#             "comments": row.get("Comment", ""),
#         }
#     if entity == "contacts":
#         return {"name": row.get("NAME", ""), "last_name": row.get("LAST_NAME", "")}
#     if entity == "leads":
#         return {"title": row.get("TITLE", "")}
#     if entity == "deals":
#         return {"title": row.get("TITLE", "")}
#     return {}

# def _parse_decimal(self, value):
#     if not value:
#         return None
#     try:
#         return float(str(value).replace(",", "").strip())
#     except ValueError:
#         return None


# Logo — not in your Company model. It'll be preserved in raw_data only, per our earlier discussion. Add a logo_url field later if you need it displayed.
# ID — your command does bitrix_id=row["ID"], that still works since ID is the first column.
# Created / Modified — you have date_create / date_modify fields on the model but they're not in _map_fields yet. Bitrix date exports are often in a locale-specific string format (e.g. 12/25/2024 3:45:00 PM), so mapping these safely needs a parser — want me to add that once you confirm the exact date format in the export (check one row's Created value)?
# The "Details: ..." columns (address details, VAT, etc.) are Bitrix's requisite/bank-details block — a separate related entity, not company fields. Skip those for now unless you need them.
   
    #######################
    # 2. Get the app + migrations in place
    #######################
    # py manage.py makemigrations
    # py manage.py migrate
    # 2.2 Then test on a small sample before the full file — pull the first few lines with the right encoding in PowerShell:
    # (Terminal)
    # Get-Content brokercity\data_imports\companies.csv -TotalCount 6 | Set-Content brokercity\data_imports\companies_sample.csv
    # py manage.py import_bitrix companies data_imports\companies_sample.csv

    # Unknown command: 'import_bitrix'

    #FINALLY
    #2.3 Check it landed correctly:
    # powershell 
    # python manage.py shell
    ######################################
    #  from crm.models import Company
    # c = Company.objects.first()
    # print(c.title, c.bitrix_id, c.phone, c.raw_data.get("Logo"))
   
    # If that looks right, run the full file:
    # python manage.py import_bitrix companies data_imports\companies.csv

################################################################################################################
    #########################
    # 3.Fix the field mapping to match your real CSV headers :
    #########################
    # Your current _map_fields only maps title. Update it once you know the real header names — e.g. 
    # if the CSV uses COMPANY_TITLE and LOGO: By edit :
    
    # def _map_fields(self, entity, row):
    # if entity == "companies":
    #     return {
    #         "title": row.get("COMPANY_TITLE") or row.get("TITLE", ""),
    #         "company_type": row.get("COMPANY_TYPE", ""),
    #         "phone": row.get("PHONE", ""),
    #         "email": row.get("EMAIL", ""),
    #         "website": row.get("WEBSITE", ""),
    #         "address": row.get("ADDRESS", ""),
    #     }
    # ...

    #Leave logo out of defaults for now unless you added the field to the model — it'll still be preserved in raw_data.)
    
    ############################
    # 4. Dry-run on a small sample first
    ############################
    # head -6 brokercity/data_imports/companies.csv > brokercity/data_imports/companies_sample.csv
    # python manage.py import_bitrix companies brokercity/data_imports/companies_sample.csv

    # Then check it landed correctly:

    # bash(Terminal)
    # python manage.py shell
    
    # from crm.models import Company
    # c = Company.objects.first()
    # print(c.title, c.bitrix_id, c.raw_data)

    # 5. One CSV gotcha to watch for
    # csv.DictReader reads everything as strings, including ID. Your command does:

    # python(Terminal)
    # bitrix_id=row["ID"]

    # Since bitrix_id is a PositiveIntegerField, Django will coerce "123" → 123 automatically on save — that part's fine. But watch for:
    # Empty rows / blank ID values → will raise ValueError or fail the PositiveIntegerField constraint. Worth adding a guard:
    
    # for row in rows:
    # if not row.get("ID"):
    #     continue

    # 7. Run the full import
    # Once the sample looks right:
    # (Terminal)
    #python manage.py import_bitrix companies brokercity/data_imports/companies.csv
