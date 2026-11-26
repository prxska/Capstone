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
        height: 'wrap_content',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 18,
        flexDirection: 'column',
        padding: 12,
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
          flexGap: 8,
          marginBottom: 8,
        }}
      >
        <FlexWidget
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            backgroundColor: '#DBEAFE',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TextWidget
            text="M"
            style={{ color: '#0369A1', fontSize: 15, fontWeight: 'bold' }}
          />
        </FlexWidget>
        <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
          <TextWidget
            text="Próximas atenciones"
            maxLines={1}
            truncate="END"
            style={{ color: '#102A43', fontSize: 14, fontWeight: 'bold' }}
          />
          <TextWidget
            text="Tus recordatorios"
            maxLines={1}
            style={{ color: '#64748B', fontSize: 10, marginTop: 1 }}
          />
        </FlexWidget>
        {events.length > 0 ? (
          <FlexWidget
            style={{
              borderRadius: 10,
              backgroundColor: '#EFF6FF',
              paddingHorizontal: 8,
              paddingVertical: 5,
            }}
          >
            <TextWidget
              text={`${Math.min(events.length, 3)}`}
              style={{ color: '#0369A1', fontSize: 11, fontWeight: 'bold' }}
            />
          </FlexWidget>
        ) : null}
      </FlexWidget>

      {events.length === 0 ? (
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
            flexGap: 9,
            borderRadius: 12,
            backgroundColor: '#F8FAFC',
            padding: 10,
          }}
        >
          <FlexWidget
            style={{
              width: 28,
              height: 28,
              borderRadius: 9,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TextWidget
              text="OK"
              style={{ color: '#15803D', fontSize: 9, fontWeight: 'bold' }}
            />
          </FlexWidget>
          <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
            <TextWidget
              text="Todo al día"
              maxLines={1}
              style={{ color: '#102A43', fontSize: 12, fontWeight: 'bold' }}
            />
            <TextWidget
              text="Agrega una cita o medicamento para verla aquí."
              maxLines={2}
              truncate="END"
              style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}
            />
          </FlexWidget>
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
            event.time,
            event.date,
            event.patient ? `(${event.patient})` : '',
            event.location ? `Lugar: ${event.location}` : '',
          ].filter(Boolean).join(' · ');
          const accent = isAppointment ? '#D97706' : (event.color || '#0284C7');

          return (
            <FlexWidget
              key={`${event.type}-${event.title}-${index}`}
              style={{
                width: 'match_parent',
                flexDirection: 'row',
                alignItems: 'center',
                flexGap: 8,
                backgroundColor: isAppointment ? '#FFFBEB' : '#F8FAFC',
                borderWidth: 1,
                borderColor: isAppointment ? '#FDE68A' : '#E2E8F0',
                borderLeftWidth: 3,
                borderLeftColor: accent,
                borderRadius: 12,
                padding: 7,
                marginBottom: index < Math.min(events.length, 3) - 1 ? 6 : 0,
              }}
            >
              <FlexWidget
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 9,
                  backgroundColor: isAppointment ? '#FEF3C7' : '#DBEAFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TextWidget
                  text={isAppointment ? 'C' : 'Rx'}
                  style={{
                    color: isAppointment ? '#92400E' : '#0369A1',
                    fontSize: isAppointment ? 12 : 10,
                    fontWeight: 'bold',
                  }}
                />
              </FlexWidget>
              <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
                <TextWidget
                  text={event.title}
                  maxLines={1}
                  truncate="END"
                  style={{ color: isAppointment ? '#78350F' : '#102A43', fontSize: 11, fontWeight: 'bold' }}
                />
                <TextWidget
                  text={details}
                  maxLines={2}
                  truncate="END"
                  style={{ color: '#64748B', fontSize: 9, marginTop: 2 }}
                />
              </FlexWidget>
              {!isAppointment && remotePhoto ? (
                <ImageWidget
                  image={remotePhoto}
                  imageWidth={64}
                  imageHeight={thumbnailHeight}
                  resizeMode="contain"
                  style={{
                    width: 64,
                    height: thumbnailHeight,
                    borderRadius: 8,
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
