import { apiClient } from "./client"
import { NotificationsResponse, Subscription, SubscriptionsResponse } from "../types/notifications";

export async function fetchNotifications(cursor?: number, limit?: number): Promise<NotificationsResponse> {
    const response = await apiClient.get<NotificationsResponse>('/api/users/me/notifications', {
        params: { cursor, limit },
    });
    return response.data;
}

export async function fetchSubscriptions(): Promise<SubscriptionsResponse> {
    const response = await apiClient.get<SubscriptionsResponse>('/api/users/me/subscriptions');
    return response.data;
}