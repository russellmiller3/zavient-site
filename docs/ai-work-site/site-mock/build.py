"""Builds the Zavient site mock book: injects the shared style and the offer block into each sample page,
writes the tab files, then the book file the dataflowgram builder turns into one HTML page."""
import json, pathlib

here = pathlib.Path(__file__).parent
style = (here / "style.css.txt").read_text()
cta = (here / "cta.html.txt").read_text()
tabs = [("p1-home", "Home page"), ("p2-job-industry", "Job × industry page"), ("p3-industry", "Industry page"),
        ("p4-model", "Model page"), ("p5-news", "News page")]
diagrams = ["flow.json"]
for i, (stem, title) in enumerate(tabs, start=2):
    body = (here / f"{stem}.body.txt").read_text().replace("{{CTA}}", cta)
    (here / f"{stem}.html").write_text(style + body)
    diagrams.append({"title": f"{i} · {title}", "intro": "Sample page. Items marked sample are invented.", "htmlFile": f"{stem}.html"})
book = {"title": "Zavient AI-work site: data flow and sample pages",
        "intro": "Tab 1 shows how data becomes pages and pages become leads. Tabs 2 to 6 are sample pages; every one ends with the custom-benchmark and consulting offer.",
        "diagrams": diagrams}
(here / "book.json").write_text(json.dumps(book, indent=1))
print("tabs:", len(diagrams))
