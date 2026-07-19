#!/usr/bin/env python3
"""Validate and optionally normalize SEO policy across static site pages.

The sitemap is the source of truth for indexable pages. The script enforces one
consistent Google preview policy without changing visible page images or social
sharing metadata.
"""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse