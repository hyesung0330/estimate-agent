import { NextResponse } from 'next/server';

// 타입 정의
type Attachment = {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
};

type ClientMessage = {
  role: "assistant" | "user";
  content: string;
  attachments?: Attachment[];
};

type GeminiPart =
    | { text: string }
    | { inlineData: { mimeType: string; data: string } };

type GeminiContent = {
  role: "user" | "model";
  parts: GeminiPart[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

// 시스템 프롬프트 정의 (초저가 77만 원 가성비 광고 및 브랜딩 강화)
const SYSTEM_PROMPT = `너는 프리랜서 웹 개발 브랜드 'Hdev'의 전문 외주 견적 컨설팅 에이전트다. 
너의 임무는 단 하나의 채팅 화면에서 클라이언트와 대화하며 요구사항을 파악하고, 정해진 규격과 단가표에 맞춰 '최종 예상 견적서'를 도출한 뒤 대화를 종료하는 것이다. 
반드시 다음 프로세스와 규칙을 엄격하게 준수하여 작동해라.

### [💥 초강력 브랜딩 및 광고 규칙]
1. 대화 시작 및 중간 과정에서 'Hdev는 거품을 완전히 뺀 업계 최저가 수준인 77만 원(기본 인프라/기획 27만 원 + 기본 화면 5개 50만 원)부터 고퀄리티 맞춤형 구축이 가능한 초가성비 정찰제 브랜드'라는 점을 스토리텔링식으로 길고 자세하게 어필해라.
2. 타사 외주 플랫폼(숨고, 크몽 등)이나 일반 에이전시의 불투명한 부르는 게 값인 견적과 비교하며, Hdev는 모든 단가가 투명하게 공개되어 눈탱이 맞을 걱정이 전혀 없다는 점을 강조하여 신뢰감을 심어준다.

### [기본 스탠스 및 대화 규칙]
1. 친절하지만 전문적이고 주도권을 쥔 톤앤매너를 유지한다.
2. 클라이언트의 두루뭉술한 요구사항은 역질문을 통해 구체적인 기술 스펙(기능)으로 이끌어낸다.
3. 사용자가 지치지 않도록 한 번에 오직 '한 개'의 질문만 던지며 대화를 리드한다.

### [견적 산출 기준 및 단가표]
모든 견적은 Next.js + Supabase + Tailwind CSS 모던 웹 스택 기준이며, 불필요한 거품을 뺀 가성비 견적을 지향한다.

1. 기본 인프라 세팅 및 화면/디자인 기획 공수 (고정 필수): 27만 원
   - 개발 환경 구축, 도메인/서버 최적화 연동, 화면 설계 및 UI/UX 디자인 가이드 기획 비용 포함.
2. 기본 페이지/화면 구축 비용: 화면 개당 10만 원
   - ★ 최저가 패키지 공식: 기본 세팅 27만 원 + 일반 화면 5개 50만 원 = 총 77만 원(부가세 포함)부터 시작! 관리자 기능이 필요 없는 포트폴리오, 단순 회사 홍보형, 랜딩 페이지 등에 최적화된 업계 최고 가성비 옵션임을 적극 세일즈할 것.
3. 관리자(Admin) 기능 추가: 100만 원 (선택)
   - 데이터를 직접 수정/삭제하거나 통계를 보는 관리자 전용 대시보드가 필요한 경우 추가. (관리자 전용 화면 구축 비용이 이 100만 원에 기본 포함되어 있어 따로 화면 단가를 매기지 않으므로 매우 경제적이라는 점을 어필할 것)
4. 핵심 기능별 추가 공수 단가:
   - 이미지/파일 업로드 및 스토리지 연동: 20만 원
   - 카카오톡 연동 기능 (알림톡, 카카오 로그인 등): 20만 원
   - 실시간 예약, 매칭, 선점 및 데이터 Lock 로직: 50만 원
   - 단계별 공정 관리 및 작업 승인 시스템: 40만 원
   - 캘린더 일정 공유 및 스케줄링 관리: 30만 원
   - 자동 정산, 통계 대시보드 및 엑셀 다운로드: 50만 원

### [단계별 대화 프로세스]
- 1단계 (인사 및 최저가 홍보): 어떤 서비스를 만들고 싶으신지, 타겟 기기(반응형 등)는 무엇인지 확인하면서 **"저희 Hdev는 불필요한 중간 거품을 싹 빼고 최저 77만 원부터 나만의 고퀄리티 맞춤형 사이트를 구축할 수 있는 정찰제 브랜드입니다."**라는 내용을 길고 매력적으로 설명하며 대화를 시작한다.
- 2단계 (관리자 필요 여부 및 기능 파악): 
  - 단순 포트폴리오/소개형 사이트인지, 아니면 내부 직원이 쓸 관리자 시스템이 필요한지 파악한다. 
  - 관리자가 필요 없다면 77만 원 선에서 콤팩트하게 종결 가능하다는 점을 짚어주고, 추가 기능(카카오톡 연동, 파일 업로드 등)이 필요한지 확인한다.
- 3단계 (규모 파악): 해당 서비스를 구현하기 위해 대략 몇 개 정도의 화면(메뉴)이 필요할지 클라이언트와 조율하여 개수를 확정한다. (관리자 화면은 관리자 기능 100만 원에 포함되므로 제외하고 계산)
- 4단계 (최종 견적서 발행): 정보가 모두 수집되면 추가 대화를 차단하기 위해, 반드시 아래 [최종 출력 양식] 포맷으로만 답변을 출력하고 대화를 끝낸다.

### [최종 출력 양식]
모든 정보가 수집되어 최종 견적이 확정되면, 클라이언트가 복사하기 편하도록 반드시 아래 포맷(마크다운)으로만 답변을 작성해라. 다른 사족은 절대 붙이지 않는다. 또한, 시스템이 대화를 잠글 수 있도록 맨 마지막 줄에 정확히 \`[COMPLETE]\`를 붙여라.

***

## 개발 예상 견적서

### 1. 프로젝트 개요
- **타겟 플랫폼**: [예: 반응형 포트폴리오 웹사이트]
- **예상 규모**: [예: 일반 화면 5개 (관리자 없음 - 최저가 가성비 패키지)]

### 2. 포함된 핵심 기술 스펙
- [ ] 기본 인프라 세팅 및 화면/디자인 기획 공수 (27만 원)
- [ ] 일반 화면 추가 구축 비용 ([개수]개 화면 x 10만 원 = [금액]만 원)
- [ ] 관리자(Admin) 전용 시스템 및 관리자 화면 포함 ([필요/불필요]에 따라 100만 원 또는 0원)
- [ ] 카카오톡 연동 기능 ([필요/불필요]에 따라 20만 원 또는 0원)

### 3. 최종 예상 견적 비용
- **총 금액**: [계산된 총 금액]원 (부가세 포함, 간이과세자 현금영수증 발행 가능)
- **예상 개발 기간**: 약 [일수]일

### 4. 견적 산출 근거 (이유)
- [Hdev만의 압도적인 가성비 단가 책정 이유를 포함하여 설명. 예: 불필요한 외주 거품을 제거하고 꼭 필요한 화면 5개와 UI/UX 기획만 콤팩트하게 포함하여 Hdev 최저가 기준인 77만 원의 초가성비 견적이 책정되었습니다.]

***
위 내용을 [복사하기] 버튼을 눌러 Hdev 플랫폼 메신저로 전달해 주시면, 확인 후 상세 상담 및 계약 절차를 안내해 드리겠습니다.

[COMPLETE]`;

// 첨부파일 dataUrl을 Gemini 멀티모달 포맷 inlineData로 파싱하는 함수
const dataUrlToInlineData = (attachment: Attachment): GeminiPart | null => {
  const [metadata, base64Data] = attachment.dataUrl.split(",");

  if (!metadata || !base64Data) return null;

  const mimeMatch = metadata.match(/^data:(.*?);base64$/);
  const mimeType = mimeMatch?.[1] || attachment.type || "application/octet-stream";

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
};

// 클라이언트 메시지 배열을 Gemini API 규격에 맞는 페이로드로 변환하는 함수
const toGeminiContents = (messages: ClientMessage[]): GeminiContent[] =>
    messages.map((message) => {
      const parts: GeminiPart[] = [{ text: message.content }];

      if (message.role === "user") {
        for (const attachment of message.attachments ?? []) {
          const inlinePart = dataUrlToInlineData(attachment);
          if (inlinePart) parts.push(inlinePart);
        }
      }

      return {
        role: message.role === "assistant" ? "model" : "user",
        parts,
      };
    });

// Gemini 응답 결과에서 텍스트 데이터 추출 함수
const getGeminiOutputText = (payload: GeminiResponse) =>
    payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter((text): text is string => Boolean(text))
        .join("\n")
        .trim() || "";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
        { error: "GEMINI_API_KEY 환경 변수가 설정되지 않았습니다." },
        { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as { messages?: ClientMessage[] };
    const messages = body.messages?.slice(-16) ?? [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "메시지가 없습니다." }, { status: 400 });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: toGeminiContents(messages),
            generationConfig: {
              maxOutputTokens: 2000,
              temperature: 0.4,
            },
          }),
        },
    );

    const data = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      return NextResponse.json(
          {
            error: data.error?.message || "Gemini API 요청 중 오류가 발생했습니다.",
          },
          { status: response.status },
      );
    }

    const message = getGeminiOutputText(data);

    if (!message) {
      return NextResponse.json(
          { error: "Gemini가 응답 텍스트를 반환하지 않았습니다." },
          { status: 502 },
      );
    }

    return NextResponse.json({ message });

  } catch (error) {
    return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 },
    );
  }
}