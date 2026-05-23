"use client";

import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";

type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

type Message = {
  id: string;
  role: "assistant" | "user";
  content: string;
  attachments?: Attachment[];
};

const firstMessage: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "안녕하세요.\nHdev 홈페이지 예상 견적 컨설턴트입니다.\n\n어떤 서비스를 만들고 싶으신가요? 그리고 타겟 기기가 PC 웹인지 모바일 웹인지 먼저 알려주세요.",
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([firstMessage]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isComplete = useMemo(
    () => messages.some((message) => message.content.includes("[COMPLETE]")),
    [messages],
  );

  const finalEstimate = useMemo(
    () =>
      messages.findLast(
        (message) =>
          message.role === "assistant" && message.content.includes("[COMPLETE]"),
      ),
    [messages],
  );

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || isSending || isComplete) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text || "첨부한 파일을 확인해 주세요.",
      attachments,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setAttachments([]);
    setError("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok || !data.message) {
        throw new Error(data.error || "응답을 생성하지 못했습니다.");
      }

      const assistantMessage = data.message;

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: assistantMessage,
        },
      ]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "알 수 없는 오류가 발생했습니다.",
      );
      setMessages(messages);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    const files = Array.from(fileList).slice(0, 5);
    const nextAttachments: Attachment[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError("파일은 개당 10MB 이하만 첨부할 수 있습니다.");
        continue;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
        reader.readAsDataURL(file);
      });

      nextAttachments.push({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        dataUrl,
      });
    }

    setAttachments((current) => [...current, ...nextAttachments].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyEstimate = async () => {
    if (!finalEstimate) return;
    await navigator.clipboard.writeText(finalEstimate.content);
  };

  return (
    <main className="flex min-h-dvh bg-[#f7f7f8] text-[#0d0d0d]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[#e5e5e5] bg-[#171717] p-3 text-white lg:flex">
        <div className="flex h-11 items-center gap-3 rounded-lg px-3">
          <div className="grid size-8 place-items-center rounded-md bg-white text-sm font-bold text-[#171717]">
            H
          </div>
          <div>
            <p className="text-sm font-semibold">Hdev</p>
            <p className="text-xs text-[#b4b4b4]">Estimate Agent</p>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-white/10 bg-white/5 p-3 text-sm leading-6 text-[#d7d7d7]">
          한 번에 하나씩 질문하고, 견적서가 완성되면 대화가 자동으로 잠깁니다.
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[#e5e5e5] bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-md bg-[#0d0d0d] text-sm font-bold text-white lg:hidden">
              H
            </div>
            <div>
              <h1 className="text-base font-semibold">에이치데브</h1>
              <p className="text-xs text-[#6f6f6f]">홈페이지 예상 견적</p>
            </div>
          </div>
          <span className="rounded-full border border-[#dedede] px-3 py-1 text-xs text-[#6f6f6f]">
            {isComplete ? "견적 완료" : "상담 진행 중"}
          </span>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="mt-1 grid size-8 shrink-0 place-items-center rounded-md bg-[#0d0d0d] text-xs font-bold text-white">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[min(92%,44rem)] rounded-2xl px-4 py-3 text-[15px] leading-7 shadow-sm ${
                    message.role === "user"
                      ? "bg-[#2f2f2f] text-white"
                      : "border border-[#ececec] bg-white text-[#171717]"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.attachments.map((file) => (
                        <span
                          key={file.id}
                          className="rounded-full border border-white/20 bg-black/10 px-3 py-1 text-xs"
                        >
                          {file.name} · {formatBytes(file.size)}
                        </span>
                      ))}
                    </div>
                  )}
                  {message.id === finalEstimate?.id && (
                    <button
                      type="button"
                      onClick={copyEstimate}
                      className="mt-4 rounded-lg border border-[#d6d6d6] px-3 py-2 text-sm font-medium text-[#171717] transition hover:bg-[#f3f3f3]"
                    >
                      복사하기
                    </button>
                  )}
                </div>
              </article>
            ))}

            {isSending && (
              <div className="flex items-center gap-3 text-sm text-[#6f6f6f]">
                <div className="grid size-8 place-items-center rounded-md bg-[#0d0d0d] text-xs font-bold text-white">
                  AI
                </div>
                <span>견적 기준을 확인하고 있습니다...</span>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-[#e5e5e5] bg-white px-4 py-4 sm:px-6">
          <div className="mx-auto w-full max-w-3xl">
            {error && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            {attachments.length > 0 && !isComplete && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() =>
                      setAttachments((current) =>
                        current.filter((item) => item.id !== file.id),
                      )
                    }
                    className="rounded-full border border-[#dedede] bg-[#f7f7f8] px-3 py-1 text-xs text-[#4f4f4f]"
                  >
                    {file.name} · {formatBytes(file.size)} ×
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`flex items-end gap-2 rounded-2xl border border-[#d9d9d9] bg-white p-2 shadow-sm ${
                isComplete ? "opacity-60" : ""
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
                className="hidden"
                onChange={(event) => void handleFiles(event.target.files)}
              />
              <button
                type="button"
                aria-label="파일 첨부"
                title="파일 첨부"
                disabled={isComplete || isSending}
                onClick={() => fileInputRef.current?.click()}
                className="grid size-10 shrink-0 place-items-center rounded-xl text-xl text-[#5f5f5f] transition hover:bg-[#f0f0f0] disabled:cursor-not-allowed"
              >
                +
              </button>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isComplete || isSending}
                rows={1}
                placeholder={
                  isComplete
                    ? "견적이 완료되어 대화가 종료되었습니다."
                    : "Hdev에 만들고 싶은 홈페이지를 설명해 주세요."
                }
                className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-[#8f8f8f] disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                aria-label="메시지 보내기"
                title="메시지 보내기"
                disabled={
                  isComplete ||
                  isSending ||
                  (!input.trim() && attachments.length === 0)
                }
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0d0d0d] text-lg text-white transition hover:bg-[#2f2f2f] disabled:cursor-not-allowed disabled:bg-[#d7d7d7]"
              >
                ↑
              </button>
            </form>
            <p className="mt-2 text-center text-xs text-[#8f8f8f]">
              이미지와 문서를 첨부해 요구사항을 함께 전달할 수 있습니다.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
