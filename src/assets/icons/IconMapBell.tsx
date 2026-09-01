import React from 'react';
import {TouchableOpacity, Image} from 'react-native';

type Props = {
    size?: number;
    onPress?: () => void;
    // 안 읽은 알림이 있으면 notification_homeUnread 이미지로 교체
    showBadge?: boolean;
};

const IMAGE_READ = require('../image/notification_home.png');
const IMAGE_UNREAD = require('../image/notification_homeUnread.png');

export default function IconMapBell({size = 44, onPress, showBadge = false}: Props) {
    return (
        <TouchableOpacity
            style={{width: size, height: size, justifyContent: 'center', alignItems: 'center'}}
            onPress={onPress}>
            <Image
                source={showBadge ? IMAGE_UNREAD : IMAGE_READ}
                style={{width: size, height: size}}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
}
