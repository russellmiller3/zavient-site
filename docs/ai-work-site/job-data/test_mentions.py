"""Checks the job-ad mention counter on four made-up ads: a repost counts once, a maker's own ad never counts for
its own model, counts are by distinct employer, and a 'Microsoft Certified Professional (MCP)' line is not the Model
Context Protocol. Run through Runner (see TRUTH.md, 'How results are judged')."""
import pathlib, sys, unittest

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from mentions import count_window  # noqa: E402

ADS = [
    {"id": "1", "company": "Acme Bank", "job_title": "AI Engineer", "date_posted": "2026-11-21T10:00:00+00:00",
     "description": "Build agents with Claude and LangChain.", "esco_skills": [{"label": "SQL"}], "technology_slugs": ["python"]},
    {"id": "2", "company": "Acme Bank", "job_title": "AI Engineer", "date_posted": "2026-11-22T10:00:00+00:00",
     "description": "Repost: Build agents with Claude.", "esco_skills": [], "technology_slugs": []},
    {"id": "3", "company": "Anthropic", "job_title": "Research Engineer", "date_posted": "2026-11-23T10:00:00+00:00",
     "description": "Train Claude. Microsoft Certified Professional (MCP) a plus.", "esco_skills": [{"label": "SQL"}], "technology_slugs": []},
    {"id": "4", "company": "Beta Health", "job_title": "ML Engineer", "date_posted": "2026-11-24T10:00:00+00:00",
     "description": "Use the Model Context Protocol and Claude Code.", "esco_skills": [], "technology_slugs": ["python"]},
]


class CountWindow(unittest.TestCase):
    def setUp(self):
        self.w = count_window(ADS, "2026-11-25")

    def test_reposts_and_employers(self):
        """Protects: the same company reposting the same title counts once, and the window reports its real posted
        dates. Fails if repost removal breaks (4 ads, not 3) or the date range is wrong again (the '30 days' error)."""
        self.assertEqual((self.w["ads_pulled"], self.w["ads"], self.w["employers"]), (4, 3, 3))
        self.assertEqual((self.w["posted_from"], self.w["posted_to"]), ("2026-11-21", "2026-11-24"))

    def test_maker_excluded_from_own_model(self):
        """Protects: a model maker's own ads never count toward its own model (every Anthropic ad names Claude).
        Fails if the maker exclusion is dropped: Claude would show 3 employers instead of 2."""
        self.assertEqual(self.w["terms"]["model"]["Anthropic / Claude"]["employers"], 2)
        self.assertEqual(self.w["terms"]["model"]["Anthropic / Claude"]["share_of_employers"], 66.7)

    def test_mcp_certification_is_not_model_context_protocol(self):
        """Protects: 'Microsoft Certified Professional (MCP)' is not counted as the Model Context Protocol.
        Fails if the MCP pattern loses its lookarounds and counts the certification (2 employers, not 1)."""
        self.assertEqual(self.w["terms"]["platform"]["MCP (Model Context Protocol)"]["employers"], 1)

    def test_provider_tags_counted_by_employer(self):
        """Protects: the provider's skill and technology tags are counted by distinct employer, like the terms.
        Fails if tags are counted by ad, or if a repost's tags are counted twice."""
        self.assertEqual(self.w["top_skills"][0], {"skill": "SQL", "employers": 2, "share_of_employers": 66.7})
        self.assertEqual(self.w["top_tech"][0]["employers"], 2)


if __name__ == "__main__":
    unittest.main()
