#!/usr/bin/env bash
# Submit one test lead per form type to the local backend.
# Usage: LEAD_API_INGEST_KEY=<key> bash scripts/test-leads.sh [BASE_URL]
# BASE_URL defaults to http://localhost:3001. Safe with GHL_MOCK_MODE=true.
set -euo pipefail

BASE_URL="${1:-http://localhost:3001}"
URL="$BASE_URL/api/public/leads/submit"
KEY_HEADER=()
if [[ -n "${LEAD_API_INGEST_KEY:-}" ]]; then
  KEY_HEADER=(-H "x-goldway-key: $LEAD_API_INGEST_KEY")
fi

post() {
  echo "== $1 =="
  curl -sS -X POST "$URL" -H "Content-Type: application/json" "${KEY_HEADER[@]}" -d "$2"
  echo -e "\n"
}

post medicare '{"formType":"medicare","firstName":"Test","lastName":"Medicare","phone":"555-201-0001","email":"test.medicare@example.com","zipCode":"85001","county":"Maricopa","turning65":"Yes","currentlyEnrolledMedicare":"No","bestTimeToCall":"Morning","medicareHelpWith":["Understanding options"],"medicareBiggestQuestion":"Which plan fits?","campaign":"google-medicare","landingPageUrl":"https://goldwaycapital.com/medicare","emailConsent":"Yes","smsConsent":"Yes"}'

post final-expense '{"formType":"final-expense","firstName":"Test","lastName":"FinalExpense","phone":"555-201-0002","email":"test.fe@example.com","zipCode":"75001","ageRange":"60-69","finalExpenseCoverage":"No","bestTimeToCall":"Afternoon","finalExpenseMostImportant":"Funeral costs","campaign":"fb-fe","landingPageUrl":"https://goldwaycapital.com/final-expense","emailConsent":"Yes","smsConsent":"No"}'

post reverse-mtg '{"formType":"reverse-mtg","firstName":"Test","lastName":"Reverse","phone":"555-201-0003","email":"test.reverse@example.com","zipCode":"90001","age62OrOlder":"Yes","primaryResidence":"Yes","estimatedHomeValue":"$500k-$750k","estimatedMortgageBalance":"$100k-$200k","reverseMortgageMainGoal":"Retirement income","bestTimeToCall":"Evening","campaign":"google-reverse","landingPageUrl":"https://goldwaycapital.com/reverse-mortgage","emailConsent":"Yes","smsConsent":"Yes"}'

post probate '{"formType":"probate","firstName":"Test","lastName":"Probate","phone":"555-201-0004","email":"test.probate@example.com","state":"CA","realEstateSituation":"Inherited property","executorOrHeir":"Executor","realEstateTimeline":"3-6 months","bestTimeToCall":"Morning","campaign":"referral","landingPageUrl":"https://goldwaycapital.com/probate","emailConsent":"Yes","smsConsent":"No"}'

post recruiting '{"formType":"recruiting","firstName":"Test","lastName":"Recruit","phone":"555-201-0005","email":"test.recruit@example.com","stateOfResidence":"FL","insuranceLicense":"Yes","licensedLines":["Health","Life"],"ahipCertified":"Yes","recruitingBackground":"3 years MA sales","campaign":"linkedin","landingPageUrl":"https://goldwaycapital.com/careers","emailConsent":"Yes","smsConsent":"Yes"}'

echo "Done. Check the admin panel (GET /api/admin/leads) and, in live mode, GHL."
