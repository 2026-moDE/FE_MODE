// ─────────────────── 알림 목록 api (GET /api/users/me/notifications) ─────────────────── 
export type Notification = {
    id: number;
    type : 'REVIEW' | 'REACTION' | 'COMMENT' | 'FRIEND_REQUEST' | 'FRIEND_ACCEPT' | 'FRIEND_REVIEW';
    title: string;
    body: string;
    place: {
        id: number;
        name: string;
    };
    review_id?: number;   // 리뷰로 이동하는 알림에만 있음 (REVIEW/REACTION/COMMENT)
    is_read: boolean;
    created_at: string;
};

export type NotificationsResponse = {
    notifications: Notification[];
    next_cursor: number | null;
};

// ─────────────────── 알림 설정 장소 목록 api (GET /api/users/me/subscriptions) ─────────────────── 

export type Subscription = {
    id: number;
    place : {
        id : number;
        name : string;
        address : string;
        thumbnail_url : string | null;
        thumbnail_small_url : string | null;
    }
    is_active : boolean;
    created_at : string;
};

export type SubscriptionsResponse = {
    subscriptions: Subscription[];
};
