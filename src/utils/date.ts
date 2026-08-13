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
    return `${diffHour}시간 전`;
}

// ISO 시간 → "2026년 8월 10일" 절대 날짜
export function formatAbsoluteDate(isoString: string): string {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return `${y}년 ${m}월 ${d}일`;
}
