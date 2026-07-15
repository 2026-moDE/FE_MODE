// ─────────────────── 알림 목록 api (GET /api/users/me/notifications) ─────────────────── 
export type Notification = {
    id: number;
    title: string;
    body: string;
    place: {
        id: number;
        name: string;
    };
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
    }
    is_active : boolean;
    created_at : string;
};

export type SubscriptionsResponse = {
    subscriptions: Subscription[];
};
