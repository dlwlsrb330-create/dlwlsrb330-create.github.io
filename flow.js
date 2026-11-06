// flow.js — 버튼 → 화면 연결표. 한 줄 = 연결 하나. 요소는 피그마 레이어 이름(data-name)으로 찾는다. 이름이 바뀌면 이 줄만 고친다.
// 5판: 화면은 주형 FigJam 「와이어프레임 V4 · 라이트」(발산 D 화면만 어두운 「V4」). 관리 메뉴 M1 아래 M2~M5·S0, 기록 T1 아래 T2·T9·T3·T2-1 과 각 수정(-E).
// [화면, 요소 이름(앞부분 일치), 가는 곳, 방식]  방식: push(오른쪽에서 밀려옴) · sheet(아래서 올라옴, 뒤는 그대로) · replace · back(뒤로) · ask · fn:동작 이름(actions.js)
// 요소 이름 "text:글자" 는 글자 앞부분으로, "text=글자" 는 글자 전체가 같은 것으로 찾는다. "*" 는 화면 자체(아무 데나).
// 11-05: OB-4(주제를 건너뛴 홈)엔 질문 칩 · 주제문이 없어서 topic=false 로 그 줄을 뺀다
const HOME_TOP = (s, topic = true) => [
  [s, "btn 관리 메뉴", "M1", "sheet"], [s, "text:프로덕트디자인4", "H5", "sheet"], [s, "btn 기록", "T1", "push"], [s, "btn 녹음 시작", "R1", "sheet"],
  ...(topic ? [[s, "칩 할 일 요약", "H6", "ask"], [s, "칩 저번 회의 결론", "H7", "ask"], [s, "칩 교수님 피드백", "H8", "ask"]] : []), [s, "범위", "H9", "sheet"], [s, "btn 첨부", "H10", "sheet"],
  [s, "입력 바", "H2", "ask"], [s, "btn 음성", "", "fn:listen"], ...(topic ? [[s, "text:출근길 낯선 이와 마주치기", "T4", "push"]] : []),
];
// 5판: 서비스 상세 → [버튼 이름(btn 뒤 글자), 가져올 곳을 누르면 열 시트]. 로그인 서비스는 연결 전엔 로그인 시트, 연결된 서비스는 가져올 곳 시트
const CONNECT = [["M3-N", "-", "C-I-notion"], ["M3-G", "-", "C-I-gdrive"], ["M3-K", "대화 파일 올리기", "C-I-kakao"], ["M3-L", "구글로 로그인하고 연결", "C-L-gcal"], ["M3-MD", "폴더 고르고 연결", "C-I-md"], ["M3-SL", "슬랙으로 로그인하고 연결", "C-L-slack"],
  ["M4-GPT", "-", "C-I-ai"], ["M4-CL", "-", "C-I-ai"], ["M4-GE", "구글로 로그인하고 연결", "C-L-gemini"], ["M4-PX", "Perplexity로 로그인하고 연결", "C-L-px"], ["M4-CP", "GitHub로 로그인하고 연결", "C-L-copilot"]];
// 로그인이 끝나면 열 가져올 곳 시트
const AFTER_LOGIN = { figma: "C-I-figma", gcal: "C-I-gcal", slack: "C-I-slack", gemini: "C-I-ai", px: "C-I-ai", copilot: "C-I-ai" };
const FLOW = [
  // ---- 홈 (마스코트를 누르면 발산 — router.tapMascot) ----
  ...HOME_TOP("H1"),
  ...HOME_TOP("OB-4", false), ["OB-4", "시작 준비 카드", "OB-2", "push"], ["OB-4", "text:무슨 주제인가요", "OB-2", "push"],
  // ---- 묻고 답 (H2 · H6 · H7 · H8 · H11 같은 틀) ----
  ...["H2", "H6", "H7", "H8", "H11"].flatMap(s => [
    [s, "btn 기록", "T1", "push"], [s, "btn 관리 메뉴", "M1", "sheet"], [s, "btn 첨부", "H10", "sheet"], [s, "btn 음성", "", "fn:listen"],
    [s, "동작 칸 36 · ic_thumbs_up", "", "fn:like"], [s, "동작 칸 36 · ic_thumbs_down", "", "fn:dislike"], [s, "동작 칸 36 · ic_refresh", s, "ask"], [s, "동작 칸 36 · ic_vector_sound", "", "fn:readAloud"],
    [s, "text:출근길 낯선 이와 마주치기", "", "fn:goHome"],                           // 5판: 채팅 위 주제문 → 홈 (홈의 주제문은 그대로 공유 맥락 T4)
  ]),
  ["H2", "입력 바", "H11", "ask"], ["H6", "입력 바", "H6", "ask"], ["H7", "입력 바", "H7", "ask"], ["H8", "입력 바", "H8", "ask"], ["H11", "입력 바", "H11", "ask"],
  ["H2", "출처", "T2", "push"], ["H6", "출처", "T2", "push"], ["H7", "출처", "T2", "push"], ["H8", "출처", "T9", "push"], ["H11", "출처", "T2", "push"],
  ["H2", "text:남은 할 일 정리해줘", "H6", "ask"], ["H2", "text:2차 회의랑", "H7", "ask"], ["H11", "text:정류장 사용 상황 발산해보기", "", "fn:diverge"], ["H11", "text:교수님 중간 피드백", "T9", "push"],
  ["H6", "할 일 카드", "", "fn:checkTodo"],
  // ---- 홈 위의 시트·팝오버 (어두운 바탕·바깥을 누르면 닫힘) ----
  ["H5", "dim", "", "back"], ["H5", "타일", "", "back"], ["H5", "text=새 프로젝트", "OB-1", "push"], ["H5", "text=링크로 합류", "H5-1", "replace"],   // 11-03: 링크로 합류 → 링크 붙여넣기 시트 → 합류 완료
  ["H5-1", "dim", "", "back"], ["H5-1", "icon x", "", "back"], ["H5-1", "btn 합류하기", "H5-2", "push"], ["H5-2", "btn 시작하기", "", "fn:goHome"],
  ["H9", "popover", "", "back"], ["H9", "*", "", "back"], ["H10", "popover", "", "back"], ["H10", "*", "", "back"],
  // ---- 관리 메뉴 M1 (☰) → 팀 · 자료 · ai · 휴지통 · 설정 ----
  ["M1", "dim", "", "back"], ["M1", "btn 닫기", "", "back"], ["M1", "text=팀", "M2", "push"], ["M1", "text=3명", "M2", "push"], ["M1", "text=자료 연결", "M3-C", "push"], ["M1", "text=ai 연결", "M4-A", "push"],
  ["M1", "줄 프로젝트 관리", "H5", "replace"], ["M1", "줄 팀", "M2", "push"], ["M1", "줄 자료 연결", "M3-C", "push"], ["M1", "줄 ai 연결", "M4-A", "push"], ["M1", "줄 휴지통", "M5", "push"],   // 11판: 줄 전체(화살표 포함)
  ["M1", "text=휴지통", "M5", "push"], ["M1", "btn 설정", "S0", "push"], ["M1", "text=로그아웃", "", "fn:logout"],   /* 11-05 주형: 로그아웃(전엔 반응 없음) */ ["M1", "text=프로젝트 관리", "", "back"], ["M1", "text=프로덕트디자인4", "H5", "replace"],
  ["M2", "btn 뒤로", "", "back"], ["M2", "초대 입력칸", "M2-2", "sheet"], ["M2", "일반 접근 줄", "", "fn:m2Perm"], ["M2", "text:수정 가능", "", "fn:m2Perm"], ["M2", "text:보기만", "", "fn:m2Perm"],   // 11-06 진규: 검색칸 · 링크 줄 권한은 눌러 고르면 글자가 바뀜(m2Perm), 멤버 줄은 예전대로
  // 11-05 주형: M2-1 권한 시트 = 멤버 권한 · 팀원 초대(M2-2) · 온보딩 초대(OB-INV) 공용. 선택지는 permPick(초대에서 열었으면 고른 권한을 그 줄에 넣고 닫음, 아니면 닫기만)
  ["M2-1", "dim", "", "fn:permDim"], ["M2-1", "선택됨", "", "fn:permPick"], ["M2-1", "text=수정 가능", "", "fn:permPick"], ["M2-1", "text=보기만", "", "fn:permPick"], ["M2-1", "text=전체 권한", "", "fn:permPick"], ["M2-1", "text=팀에서 내보내기", "", "back"],
  ["M2-2", "dim", "", "back"], ["M2-2", "btn 초대", "", "fn:invite"], ["M2-2", "공유", "", "fn:invite"], ["M2-2", "btn 완료", "", "back"], ["M2-2", "권한 · 초대할 사람", "", "fn:invitePerm"],   // 11-05 주형: 초대할 사람 권한 → M2-1 시트 (이름은 ob_invite_page.js 가 붙임)
  ["M3-C", "btn 뒤로", "", "back"], ["M3-C", "연결 칩 피그마", "M3-D", "push"], ["M3-C", "연결 칩 노션", "M3-N", "push"], ["M3-C", "연결 칩 구글 드라이브", "M3-G", "push"],   // 5판: 서비스별 상세
  ["M3-D", "btn 뒤로", "", "back"], ["M3-D", "btn 연결 끊기", "", "fn:disconnect"],
  ["M4-A", "btn 뒤로", "", "back"],
  ["M5", "btn 뒤로", "", "back"], ["M5", "btn 되살리기", "", "fn:restore"], ["M5", "휴지통 그룹", "M5-2", "sheet"], ["M5", "btn 휴지통 비우기", "", "back"],
  ["M5-2", "dim", "", "back"], ["M5-2", "text=되살리기", "", "fn:restore"], ["M5-2", "text=완전히 지우기", "", "back"],
  ["S0", "btn 뒤로", "", "back"], ["S0", "text=알림", "S1", "push"], ["S0", "text=화면 모드", "S2", "push"], ["S0", "text=글자 크기", "S2", "push"],
  ["S1", "btn 뒤로", "", "back"], ["S2", "btn 뒤로", "", "back"],
  ["T4", "btn 뒤로", "", "back"], ["T4", "카드 · 결정한 이유", "", "fn:fold"], ["T4", "카드 · 맥락", "", "fn:fold"],   /* 11-05 주형: 펼쳐진 두 칸도 눌러서 접기 */ ["T4", "카드 · 고민 중", "", "fn:expand"], ["T4", "카드 · 할 일", "", "fn:expand"], ["T4", "카드 · ai가 지킬 것", "", "fn:expand"],   // 5판: 접힌 칸 펼치기
  // ---- 녹음: 마이크 → 확인 시트 → 버튼이 알약으로 늘어남 → 녹음 중 → 알약 누르면 정리 → 기록 상세 ----
  ["R1", "dim", "", "back"], ["R1", "btn 녹음 시작", "R2-6c", "fn:startRecording"], ["R1", "슬롯 외부 참여자 추가", "R1-1", "sheet"],
  ["R1-1", "dim", "", "back"], ["R1-1", "btn 추가하기", "", "back"], ["R1-1", "btn 추가", "", "back"],
  // ---- 발산 (검정) — 마스코트를 다시 누르면 홈 ----
  ["D1", "btn 발산 방식", "D2", "sheet"], ["D1", "담은 카드", "", "fn:openSaved"], ["D1", "입력 바", "", "fn:throwIdea"], ["D1", "btn 음성", "", "fn:listen"],
  ["D1", "btn 기록", "T1", "fn:d1Go"], ["D1", "text:프로덕트디자인4", "H5", "fn:d1Go"], ["D1", "btn 관리 메뉴", "M1", "fn:d1Go"],   // 11-05 주형: 발산 위쪽 줄 = 홈 위쪽 줄 (d1_topbar.js)
  ["D2", "dim", "", "back"], ["D2", "btn 이 방식으로 뽑기", "D4", "fn:drawCards"], ["D2", "카드 장수", "", "fn:pickCount"],
  ["D4", "btn 닫기", "D1", "back"], ["D5", "btn 뒤로", "", "back"], ["D6", "btn 뒤로", "", "back"],
  // ---- 기록 T1 → 회의 T2 · 피드백 T9 · 형태 T3 · 녹음 T2-1 → 각 수정(-E) ----
  ["T1", "btn 뒤로", "", "back"], ["T1", "btn 기록 찾기", "T7", "fn:search"], ["T1", "btn 음성", "", "fn:listen"], ["T1", "text:공유 문서", "T4", "push"], ["T1", "text:출근길 낯선 이와", "T4", "push"],
  ["T1", "text:방향 좁히기", "T2", "push"], ["T1", "text:대상 정하기", "T2", "push"], ["T1", "text:주제 고르기", "T2", "push"], ["T1", "text:#회의", "T2", "push"], ["T1", "아이콘 바탕", "T2", "push"],
  ["T1", "칩 ", "", "fn:filterChip"], ["T1", "고정 표시", "T5", "sheet"],
  ["T2", "btn 뒤로", "", "back"], ["T2", "btn 수정", "T2-E", "push"], ["T2", "btn 다시 듣기", "", "fn:listen"], ["T2", "btn 출처 · 원문 전체 보기", "T2-1", "push"],
  ["T9", "btn 뒤로", "", "back"], ["T9", "btn 수정", "T9-E", "push"], ["T9", "btn 다시 듣기", "", "fn:listen"], ["T9", "btn 출처 · 원문 전체 보기", "T2-1", "push"],
  ["T3", "btn 뒤로", "", "back"], ["T3", "btn 수정", "T3-E", "push"],
  ["T2-1", "btn 뒤로", "", "back"], ["T2-1", "btn 수정", "T2-1-E", "push"], ["T2-1", "btn 재생", "", "fn:listen"],
  ...["T2-E", "T9-E", "T3-E", "T2-1-E"].flatMap(s => [[s, "btn ← 기록", "", "back"], [s, "btn 완료", "", "fn:saveEdit"], [s, "btn 다시 듣기", "", "fn:listen"], [s, "btn 이 시점 재생", "", "fn:listen"], ...(["T2-E", "T9-E"].includes(s) ? [[s, "btn 출처 · 원문 전체 보기", "T2-1", "push"]] : [])]),   /* 11-05: 원문 전체 보기는 회의 · 피드백 수정에만 있음 (형태 수정은 피그마 원본, 녹음 수정은 원문 자체) */
  ["T5", "dim", "", "back"], ["T5", "text:휴지통으로", "T6", "replace"], ["T5", "text:공유 문서에서 고치기", "T4", "replace"],
  ["T6", "dim", "", "back"], ["T6", "text=취소", "", "back"], ["T6", "text=보내기", "T1", "fn:trash"],
  ["T7", "btn 뒤로", "", "fn:goHome"], ["T7", "지우기", "", "fn:clearSearch"],   /* 11-05 주형: 찾기 결과에서 뒤로 = 홈, × = 검색어만 지움 */ ["T7", "text:정류장 우산", "T2", "push"], ["T7", "text:방향 좁히기", "T2", "push"], ["T7", "text:형태 스케치", "T3", "push"], ["T7", "text:대상 정하기", "T2", "push"], ["T7", "text:못 찾으면", "H2", "ask"],
  ["T8", "btn 뒤로", "", "fn:goHome"], ["T8", "지우기", "", "fn:clearSearch"], ["T8", "btn ai에게 묻기", "H2", "ask"],
  // ---- 온보딩 ----
  ["OB-1", "btn 다음", "OB-2", "fn:obStep"],   /* 11-05 주형: 단계마다 마스코트 모양이 바뀜 (주제 = 생각구름, 팀원 초대 = 돋보기, 자료 연결 = 전구) */ ["OB-1", "이름 입력", "", "fn:typing"], ["OB-1", "태그 칩", "", "fn:pickTag"], ["OB-1", "text=건너뛰기", "OB-4", "push"],
  ["OB-2", "btn 다음", "OB-INV", "fn:obStep"],   /* 11-05 주형: topicDone(전구) 대신 다른 단계와 같은 obStep */   /* 티즈판: 주제 → 팀원 초대 → 연결 */ ["OB-2", "btn 뒤로", "", "back"], ["OB-2", "주제 입력", "", "fn:typing"], ["OB-2", "btn 말로 입력", "", "fn:listen"], ["OB-2", "text=건너뛰기", "OB-4", "push"],
  ["OB-INV", "btn 다음", "OB-3", "fn:obStep"], ["OB-INV", "btn 뒤로", "", "back"], ["OB-INV", "text=건너뛰기", "OB-4", "push"], ["OB-INV", "btn 초대", "", "fn:obInvite"], ["OB-INV", "공유", "", "fn:obShare"], ["OB-INV", "초대 링크 줄", "", "fn:obCopy"], ["OB-INV", "초대 권한 줄", "", "fn:obPerm"],   /* 13판: 링크 복사 · 권한 바꾸기 · 보내기(아이폰 공유 시트) */   // 티즈판: 온보딩 팀원 초대 페이지 (ob_invite_page.js 가 OB-2 틀 + M2-2 초대 부품으로 만듦)
  ["OB-3", "btn 뒤로", "", "back"], ["OB-3", "타일 피그마", "OB-3-1", "push"], ["OB-3", "타일", "", "fn:connect"], ["OB-3", "btn 시작하기", "H1", "fn:start"], ["OB-3", "text=건너뛰기", "OB-4", "push"],
  ["OB-3-1", "btn 뒤로", "", "back"], ["OB-3-1", "btn 피그마로 연결", "C-L-figma", "sheet"], ["OB-3-1", "가져온 기록", "C-L-figma", "sheet"],   // 5판: 로그인 시트 → 외부 로그인 → 가져올 곳 → 온보딩으로
  // ---- 5판: Page 10 기준으로 눌러도 반응이 없던 것 ----
  ...["T2", "T9", "T3"].map(s => [s, "칩 #", "T7", "fn:search"]),                               // 상세의 태그 → 그 태그로 기록 찾기
  ...["T2-E", "T9-E", "T3-E", "T2-1-E"].flatMap(s => [[s, "칩 #", "", "fn:removeTag"], [s, "칩 + 태그", "", "fn:pickTag"], [s, "상태 칩", "", "fn:dropMenu"], [s, "카드 · 플레이어", "", "fn:listen"]]),
  ["T2", "카드 · 플레이어", "", "fn:listen"], ["T9", "카드 · 플레이어", "", "fn:listen"], ["T9", "카드 · 관련 기록", "T2", "push"], ["T9-E", "카드 · 관련 기록", "T2", "push"], ["T3-E", "btn 이미지 바꾸기", "", "fn:pickTag"],
  ["T7", "btn 기록 찾기", "T7", "fn:search"], ["T8", "btn 기록 찾기", "T7", "fn:search"], ["T7", "btn 음성", "", "fn:listen"], ["T8", "btn 음성", "", "fn:listen"], ["T7", "칩 ", "", "fn:filterChip"],
  ...["H2", "H6", "H7", "H8", "H11"].map(s => [s, "동작 칸 36 · ic_more", "", "fn:dropMenu"]),
  ["M2", "btn more", "M2-1", "sheet"],
  ...["S1", "M3-D", "OB-3-1"].map(s => [s, "토글", "", "fn:toggleSwitch"]),
  // ---- 5판: 자료 연결 · ai 연결 서비스별 화면 (Page 10 「Claude 추가 · 연결 화면」) ----
  ...[["카드 카톡 내보내기", "M3-K", "#866:5556"], ["카드 구글 캘린더", "M3-L", "#866:5575"], ["카드 개인 md", "M3-MD", "#866:5585"], ["카드 슬랙", "M3-SL", "#866:5597"]].flatMap(([c, d, b]) => [["M3-C", c, d, "push"], ["M3-C", b, d, "fn:openConnect"]]),
  ...[["text=ChatGPT", "M4-GPT"], ["text=Claude", "M4-CL"], ["text=Gemini", "M4-GE"], ["text=Perplexity", "M4-PX"], ["text=Copilot", "M4-CP"]].map(([t, d]) => ["M4-A", t, d, "push"]),
  ...[["#866:4849", "M4-GE"], ["#866:4858", "M4-PX"], ["#866:4865", "M4-CP"]].map(([b, d]) => ["M4-A", b, d, "fn:openConnect"]),
  ...CONNECT.flatMap(([d, how, sheet]) => [[d, "btn 뒤로", "", "back"], [d, "가져온 기록", sheet, "fn:readFrom"],   /* 11-05 주형: 연결 뒤엔 로그인 없이 고르는 시트만 (app5 readFrom) */ [d, "토글", "", "fn:toggleSwitch"], [d, "btn 연결 끊기", "", "fn:disconnect"], [d, "btn " + how, sheet, "sheet"]]),
  ["M3-D", "가져온 기록", "C-I-figma", "sheet"],
  ...["figma", "gcal", "slack", "gemini", "px", "copilot"].flatMap(k => [["C-L-" + k, "dim", "", "back"], ["C-L-" + k, "btn 취소", "", "back"], ["C-L-" + k, "btn 계속", "C-B-" + k, "push"],
    ["C-B-" + k, "btn 닫기", "", "back"], ...(["gcal", "gemini"].includes(k) ? [["C-B-" + k, "btn 취소", "", "back"]] : []), ["C-B-" + k, "btn 허용", "", "fn:connectDone"]]),   /* 11-05: 취소는 구글 허용 단계(g3)에만 있음. Figma · Slack · Perplexity · GitHub 로그인 화면은 위 ✕(btn 닫기)로 닫음 */
  ...["figma", "notion", "gdrive", "kakao", "gcal", "md", "slack", "ai"].flatMap(k => [["C-I-" + k, "dim", "", "back"], ["C-I-" + k, "행 ", "", "fn:toggleRow"], ["C-I-" + k, "btn 가져오기", "", "fn:importDone"]]),
  // ---- 5판 QA: 사용자가 누를 만한데 반응 없던 것 ----
  ...["H2", "H6", "H7", "H8", "H11"].flatMap(s => [[s, "동작 칸 36 · ic_copy", "", "fn:copied"], [s, "동작 칸 36 · ic_vector_share", "", "fn:shared"]]),
  ["H2", "추천 질문 칩 · 남은 할 일", "H6", "ask"], ["H2", "추천 질문 칩 · 2차 회의랑", "H7", "ask"],
  ["H6", "추천 질문 칩 · 할 일 담당", "H6", "ask"], ["H6", "추천 질문 칩 · 다음 회의 안건", "H6", "ask"],                  // 와이어프레임에 이 답 화면은 없음 → 같은 틀로 다시 답
  ["H7", "추천 질문 칩 · 아직 안 정한 거", "", "fn:diverge"], ["H7", "추천 질문 칩 · 결정 고치러 가기", "T4", "push"],
  ["H8", "추천 질문 칩 · 시간대 후보", "H8", "ask"], ["H8", "추천 질문 칩 · 피드백 반영", "T9", "push"],
  ["H11", "추천 질문 칩 · 정류장 사용 상황", "", "fn:diverge"],
  ...HOME_TOP("R2-6c").filter(f => f[1] !== "btn 녹음 시작"),                                                    // 녹음 중에도 홈은 그대로 쓸 수 있게 (마이크 자리는 알약)
  ["T3", "btn 출처 · 피그마에서 원본 보기", "", "fn:openFigma"], ["T3-E", "btn 출처 · 피그마에서 원본 보기", "", "fn:openFigma"], ["R1", "토글 참여", "", "fn:toggleSwitch"],
];
// 시작 화면과 화면 종류. dark = 검은 화면(발산). overlay = 시트·팝오버·다이얼로그('dim'·'popover' 앞의 것은 숨기고 뒤만 얹는다)
const SCREENS = {
  start: "H1",
  dark: ["D1", "D2", "D4", "D5", "D6"],
  overlay: ["H5-1", "C-L-figma", "C-L-gcal", "C-L-slack", "C-L-gemini", "C-L-px", "C-L-copilot", "C-I-figma", "C-I-notion", "C-I-gdrive", "C-I-kakao", "C-I-gcal", "C-I-md", "C-I-slack", "C-I-ai", "M1", "H5", "H9", "H10", "R1", "R1-1", "D2", "T5", "T6", "M2-1", "M2-2", "M5-2"],
  labels: { "H1": "H1 홈", "H2": "H2 묻고 답", "H6": "H6 할 일 요약", "H7": "H7 회의 결론", "H8": "H8 교수님 피드백", "H11": "H11 기록 수정 요청", "H5": "H5 프로젝트 전환", "H5-1": "★ H5-1 링크로 합류", "H5-2": "★ H5-2 합류 완료", "H9": "H9 범위 칩", "H10": "H10 첨부", "T4": "T4 공유 문서",
    "M1": "M1 관리 메뉴", "M2": "M2 팀 · 권한", "M2-1": "M2-1 권한 고르기", "M2-2": "M2-2 팀원 초대", "M3-C": "M3-C 자료 연결", "M3-D": "M3-D 연결 상세", "M4-A": "M4-A ai 연결", "M5": "M5 휴지통", "M5-2": "M5-2 휴지통 메뉴",
    "S0": "S0 설정", "S1": "S1 알림", "S2": "S2 화면 · 글자",
    "R1": "R1 녹음 확인", "R1-1": "R1-1 외부 참여자", "R2-6a": "R2 누르기", "R2-6c": "R2 녹음 중", "D1": "D1 발산", "D2": "D2 발산 방식", "D4": "D4 카드 덱", "D5": "D5 담은 카드", "D6": "D6 담은 카드 없음",
    "T1": "T1 기록", "T2": "T2 회의 기록", "T2-E": "T2-E 회의 수정", "T9": "T9 피드백 기록", "T9-E": "T9-E 피드백 수정", "T3": "T3 형태 기록", "T3-E": "T3-E 형태 수정", "T2-1": "T2-1 녹음 전사", "T2-1-E": "T2-1-E 녹음 수정",
    "T5": "T5 항목 메뉴", "T6": "T6 삭제 확인", "T7": "T7 검색 결과", "T8": "T8 결과 없음",
    "M3-N": "★ M3-N 노션", "M3-G": "★ M3-G 구글 드라이브", "M3-K": "★ M3-K 카톡 내보내기", "M3-L": "★ M3-L 구글 캘린더", "M3-MD": "★ M3-MD 개인 md", "M3-SL": "★ M3-SL 슬랙",
    "M4-GPT": "★ M4 ChatGPT", "M4-CL": "★ M4 Claude", "M4-GE": "★ M4 Gemini", "M4-PX": "★ M4 Perplexity", "M4-CP": "★ M4 Copilot",
    "C-L-figma": "★ 로그인 시트 · 피그마", "C-B-figma": "★ 외부 로그인 · Figma", "C-L-gcal": "★ 로그인 시트 · 캘린더", "C-B-gcal": "★ 외부 로그인 · Google(캘린더)", "C-L-slack": "★ 로그인 시트 · 슬랙", "C-B-slack": "★ 외부 로그인 · Slack",
    "C-L-gemini": "★ 로그인 시트 · Gemini", "C-B-gemini": "★ 외부 로그인 · Google(Gemini)", "C-L-px": "★ 로그인 시트 · Perplexity", "C-B-px": "★ 외부 로그인 · Perplexity", "C-L-copilot": "★ 로그인 시트 · Copilot", "C-B-copilot": "★ 외부 로그인 · GitHub",
    "C-I-figma": "★ 가져올 곳 · 피그마 파일", "C-I-notion": "★ 가져올 곳 · 노션 페이지", "C-I-gdrive": "★ 가져올 곳 · 드라이브 폴더", "C-I-kakao": "★ 가져올 곳 · 카톡 대화 파일", "C-I-gcal": "★ 가져올 곳 · 캘린더", "C-I-md": "★ 가져올 곳 · md 폴더", "C-I-slack": "★ 가져올 곳 · 슬랙 채널", "C-I-ai": "★ 가져올 곳 · ai 읽을 프로젝트",
    "OB-1": "OB-1 프로젝트", "OB-2": "OB-2 주제", "OB-INV": "OB-INV 팀원 초대", "OB-3": "OB-3 연결", "OB-3-1": "OB-3-1 피그마", "OB-4": "OB-4 건너뛴 홈" },
};
