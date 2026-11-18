/**
 * ISO 시간 → "2분 전", "1시간 전"형태로 변환
 * 흠 나중에
 */
export function formatRelativeTime(isoString: string): string {
    const past = new Date(isoString).getTime();
    const now = Date.now();
    const diffMin = Math.floor((now - past) / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${diffDay}일 전`;
}

/**
 * 실시간 탭: "방금"(1분 미만) / "N분 전" / "N시간 전"
 * 과거 탭: "월/일" (연도가 다르면 "년/월/일")
 */
export function formatReviewTime(isoString: string, isArchived: boolean): string {
    const date = new Date(isoString);

    if (isArchived) {
        const now = new Date();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        if (date.getFullYear() !== now.getFullYear()) {
            return `${date.getFullYear()}/${month}/${day}`;
        }
        return `${month}/${day}`;
    }

    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    const diffHour = Math.floor(diffMin / 60);

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;

    const now = new Date();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (date.getFullYear() !== now.getFullYear()) {
        return `${date.getFullYear()}/${month}/${day}`;
    }
    return `${month}/${day}`;
}

// ISO 시간 → "2026년 8월 10일" 절대 날짜
export function formatAbsoluteDate(isoString: string): string {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}년 ${m}월 ${d}일`;
}

// UTC(Z) ISO 시간 → KST 날짜 "2026.10.19"
// 서버가 Z로 주는 값은 기기 타임존에 따라 날짜가 하루 밀릴 수 있어서 +9를 직접 더해 고정한다
export function formatKstDate(isoString: string): string {
    const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
    const kst = new Date(new Date(isoString).getTime() + KST_OFFSET_MS);

    const y = kst.getUTCFullYear();
    const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
    const d = String(kst.getUTCDate()).padStart(2, '0');

    return `${y}.${m}.${d}`;
}

// 댓글 작성일시 (예: 2026.08.11 17:28)
export function formatCommentDate(isoString: string): string {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${d} ${hh}:${mm}`;
}
