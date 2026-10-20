"""Builds src/data/guides-published.json from the guide SQL files in supabase/content, so the
demo preview shows exactly the verified text that goes into the live database."""
import glob, json, re
out = []
pat = re.compile(r"\('(gd|vc)', false, '([a-z-]+)', '([a-z0-9-]+)', '((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*\$b\$(.*?)\$b\$,\s*'(.*?)'::jsonb,\s*'(\d{4}-\d{2}-\d{2})', '((?:[^']|'')*)', '(\d{4}-\d{2}-\d{2})'", re.S)
for f in sorted(glob.glob("supabase/content/*guides*.sql")):
    for m in pat.finditer(open(f).read()):
        cc, section, slug, title, summary, body, sources, verified, by, review = m.groups()
        out.append({"id": f"{cc}-{section}-{slug}", "countryCode": cc, "section": section, "slug": slug,
                    "title": title.replace("''", "'"), "summary": summary.replace("''", "'"), "body": body.strip(),
                    "sources": json.loads(sources.replace("''", "'")), "verifiedAt": verified, "verifiedBy": by.replace("''", "'"), "nextReviewAt": review})
json.dump(out, open("src/data/guides-published.json", "w"), ensure_ascii=False, indent=1)
print(len(out), "articles")
