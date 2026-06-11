from typing import AsyncGenerator, List, Optional

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI

from app.core.config import get_settings

settings = get_settings()

DEFAULT_SYSTEM_PROMPT = (
    "You are a helpful, knowledgeable AI assistant. Provide clear, accurate, and "
    "well-structured responses. Use markdown formatting when appropriate. For code, "
    "use proper syntax highlighting with fenced code blocks."
)

AVAILABLE_MODELS = [
    {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "default": True},
    {"id": "openai/gpt-4o", "name": "GPT-4o"},
    {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet"},
    {"id": "google/gemini-pro-1.5", "name": "Gemini Pro 1.5"},
    {"id": "meta-llama/llama-3.1-70b-instruct", "name": "Llama 3.1 70B"},
]


class AIService:
    def __init__(self, model: Optional[str] = None):
        self.model = model or settings.default_model
        self._llm = ChatOpenAI(
            model=self.model,
            openai_api_key=settings.openrouter_api_key,
            openai_api_base=settings.openrouter_base_url,
            streaming=True,
            temperature=0.7,
            max_tokens=4096,
            default_headers={
                "HTTP-Referer": "https://ai-chat-assistant.app",
                "X-Title": settings.app_name,
            },
        )

    def _build_messages(
        self,
        history: List[dict],
        user_message: str,
        system_prompt: Optional[str] = None,
    ) -> List[BaseMessage]:
        messages: List[BaseMessage] = [
            SystemMessage(content=system_prompt or DEFAULT_SYSTEM_PROMPT)
        ]
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
        messages.append(HumanMessage(content=user_message))
        return messages

    async def stream_response(
        self,
        history: List[dict],
        user_message: str,
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        messages = self._build_messages(history, user_message, system_prompt)
        async for chunk in self._llm.astream(messages):
            if chunk.content:
                yield chunk.content

    @staticmethod
    def estimate_tokens(text: str) -> int:
        # Rough estimate: ~4 chars per token
        return max(1, len(text) // 4)

    @staticmethod
    def get_available_models() -> List[dict]:
        return AVAILABLE_MODELS
