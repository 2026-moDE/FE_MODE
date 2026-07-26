import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMemo, useRef } from "react";
import { View } from "react-native";

type Props = {}

export default function ReviewChatModal(){
    const modalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(()=>['60%','80%'],[])

    return (
        <BottomSheetModal ref={modalRef} snapPoints={snapPoints}>
            <View>

            </View>
        </BottomSheetModal>
    );
}