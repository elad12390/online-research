"""
Research Agent Constants

Shared configuration for depth, style, and other settings.
This file follows the DRY principle - these values should match
the TypeScript constants in lib/research-wizard/constants.ts
"""

# Research depth configuration
DEPTH_INSTRUCTIONS = {
    "quick": "Provide a concise 15-20 minute research summary with 5-10 tool calls",
    "standard": "Provide a comprehensive 45-60 minute research with 15-20 tool calls",
    "deep": "Provide an exhaustive in-depth research with 30-40 tool calls",
    "unlimited": "Research as thoroughly as needed - NO LIMIT on tool calls or depth",
}

# Research style configuration
STYLE_INSTRUCTIONS = {
    "comprehensive": "Create detailed, well-structured documentation with multiple sections",
    "comparing": "Focus on comparisons and contrasts between options",
    "practical": "Focus on practical, actionable insights and implementation",
}

# Default model configuration per provider
DEFAULT_MODELS = {
    "anthropic": "claude-sonnet-4-5",
    "openai": "gpt-4o-mini",
    "google": "gemini-pro",
}

# Progress file limits
PROGRESS_LIMITS = {
    "RESULT_MAX_LENGTH": 500,
    "READ_FILE_MAX_LENGTH": 2000,
    "ACTIVITY_MAX_COUNT": 1000,
    "MAX_CONSECUTIVE_ERRORS": 5,
    "COMPLETION_THRESHOLD": 90,  # Percentage at which to check for missing files
    "BLOCKED_PERCENTAGE": 85,  # Cap percentage when blocked by missing files
}


def get_default_model(provider: str) -> str:
    """Get the default model for a provider."""
    return DEFAULT_MODELS.get(provider, DEFAULT_MODELS["anthropic"])


def get_depth_instruction(depth: str) -> str:
    """Get the instruction text for a given depth level."""
    return DEPTH_INSTRUCTIONS.get(depth, DEPTH_INSTRUCTIONS["standard"])


def get_style_instruction(style: str) -> str:
    """Get the instruction text for a given style."""
    return STYLE_INSTRUCTIONS.get(style, STYLE_INSTRUCTIONS["comprehensive"])
