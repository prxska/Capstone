'use no memo';

import {
    FlexWidget,
    ImageWidget,
    TextWidget,
    type ImageWidgetSource,
} from 'react-native-android-widget';

export type UpcomingAttention = {
  title: string;
  type: 'appointment' | 'recipe';
  date?: string;
  time?: string;
  patient?: string;
  location?: string;
  color?: `#${string}`;
  colorName?: string;
  photoUri?: string;
  photoWidth?: number;
  photoHeight?: number;
};

type Props = {
  events: UpcomingAttention[];
};

export function UpcomingAttentionsWidget({ events }: Props) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        flexDirection: 'column',
        padding: 8,
      }}
      accessibilityLabel="Próximas atenciones de MediTrack"
      clickAction="OPEN_URI"
      clickActionData={{ uri: 'meditrackmobile://' }}
    >
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          flexGap: 6,
          marginBottom: 6,
        }}
      >
        <FlexWidget
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#8A2BE2' }}
        />
        <TextWidget
          text="Próximas atenciones"
          maxLines={1}
          truncate="END"
          style={{ color: '#102A43', fontSize: 14, fontWeight: 'bold' }}
        />
      </FlexWidget>

      {events.length === 0 ? (
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget
            text="Abre MediTrack para actualizar tus atenciones."
            maxLines={2}
            style={{ color: '#64748B', fontSize: 11 }}
          />
        </FlexWidget>
      ) : (
        events.slice(0, 3).map((event, index) => {
          const isAppointment = event.type === 'appointment';
          const remotePhoto = event.photoUri?.startsWith('https://') || event.photoUri?.startsWith('http://')
            ? (event.photoUri as ImageWidgetSource)
            : null;
          const naturalPhotoWidth = event.photoWidth || 320;
          const naturalPhotoHeight = event.photoHeight || 96;
          const thumbnailHeight = Math.min(
            62,
            Math.max(38, Math.round(72 * naturalPhotoHeight / naturalPhotoWidth))
          );
          const details = [
            event.type === 'recipe' && event.colorName ? `Envase: ${event.colorName}` : '',
            event.time,
            event.date,
            event.patient ? `(${event.patient})` : '',
            event.location ? `Lugar: ${event.location}` : '',
          ].filter(Boolean).join(' · ');

          return (
            <FlexWidget
              key={`${event.type}-${event.title}-${index}`}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                alignItems: 'center',
                flexGap: 6,
                backgroundColor: isAppointment ? '#FFFBEB' : '#F8FAFC',
                borderWidth: 1,
                borderColor: isAppointment ? '#FCD34D' : '#E2E8F0',
                borderLeftWidth: isAppointment ? 4 : 1,
                borderLeftColor: isAppointment ? '#D97706' : '#E2E8F0',
                borderRadius: 8,
                padding: 5,
                marginBottom: 4,
              }}
            >
              <FlexWidget style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
                <FlexWidget
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isAppointment ? '#D97706' : (event.color || '#38BDF8'),
                  }}
                />
                <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
                  <TextWidget
                    text={isAppointment ? `CITA MÉDICA  ${event.title}` : event.title}
                    maxLines={1}
                    truncate="END"
                    style={{ color: isAppointment ? '#92400E' : '#102A43', fontSize: 11, fontWeight: 'bold' }}
                  />
                  <TextWidget
                    text={details}
                    maxLines={2}
                    truncate="END"
                    style={{ color: '#64849A', fontSize: 9, marginTop: 1 }}
                  />
                </FlexWidget>
              </FlexWidget>
              {!isAppointment && remotePhoto ? (
                <ImageWidget
                  image={remotePhoto}
                  imageWidth={72}
                  imageHeight={thumbnailHeight}
                  resizeMode="contain"
                  style={{
                    width: 72,
                    height: thumbnailHeight,
                    borderRadius: 6,
                    backgroundColor: '#FFFFFF',
                  }}
                />
              ) : null}
            </FlexWidget>
          );
        })
      )}
    </FlexWidget>
  );
}
