import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';

import App from '../../App';
import { server } from '../../setupTests';
import { Event } from '../../types';

/**
 * REQ-005: 반복 일정 시각적 표시
 * 
 * 테스트 범위: Integration Tests - Workflow (TODO-015 ~ TODO-017)
 * - Phase 5: 통합 테스트 (생성, 수정 워크플로우)
 */

// notistack mock
const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
      closeSnackbar: vi.fn(),
    }),
    SnackbarProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('REQ-005: 반복 일정 시각적 표시 - Integration Tests (Workflow)', () => {
  let user: ReturnType<typeof userEvent.setup>;

  const existingEvent: Event = {
    id: '1',
    title: '기존 회의',
    date: '2025-06-15',
    startTime: '10:00',
    endTime: '11:00',
    description: '기존 미팅',
    location: '회의실',
    category: '업무',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 10,
  };

  beforeEach(() => {
    user = userEvent.setup();
    enqueueSnackbarFn.mockClear();
    vi.useRealTimers(); // cleanup first
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-15T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Phase 5: Integration (통합 테스트)', () => {
    it('TODO-015: 반복 일정 생성 후 캘린더에 아이콘과 함께 표시된다', async () => {
      // 명세: REQ-005
      // 설계: TODO-015
      expect.hasAssertions();

      // Arrange - Mock 데이터 설정
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [] });
        }),
        http.post('/api/events-list', async ({ request }) => {
          const { events: newEvents } = (await request.json()) as { events: Event[] };
          const eventsWithIds = newEvents.map((event, index) => ({
            ...event,
            id: `new-${index}`,
          }));
          return HttpResponse.json(eventsWithIds, { status: 201 });
        })
      );

      // Act - 반복 일정 생성
      render(<App />);

      // 일정 정보 입력
      // const titleInput = screen.getByLabelText('제목');
      // await user.clear(titleInput);
      // await user.type(titleInput, '매일 운동');

      // const dateInput = screen.getByLabelText('날짜');
      // await user.clear(dateInput);
      // await user.type(dateInput, '2025-06-15');

      // const startTimeInput = screen.getByLabelText('시작 시간');
      // await user.clear(startTimeInput);
      // await user.type(startTimeInput, '07:00');

      // const endTimeInput = screen.getByLabelText('종료 시간');
      // await user.clear(endTimeInput);
      // await user.type(endTimeInput, '08:00');

      // 반복 설정
      // const repeatCheckbox = screen.getByLabelText('반복 일정');
      // await user.click(repeatCheckbox);

      // const repeatTypeSelect = screen.getByLabelText('반복 유형');
      // await user.click(repeatTypeSelect);
      // await user.click(screen.getByText('매일'));

      // const submitButton = screen.getByTestId('event-submit-button');
      // await user.click(submitButton);

      // Assert - 주석 처리 (Green 단계에서 주석 해제)
      // await waitFor(() => {
      //   expect(enqueueSnackbarFn).toHaveBeenCalledWith(
      //     expect.stringContaining('일정이 추가되었습니다'),
      //     expect.anything()
      //   );
      // });

      // const eventList = screen.getByTestId('event-list');
      // expect(within(eventList).getByText(/매일 운동/)).toBeInTheDocument();
      // expect(within(eventList).getByLabelText('반복 일정')).toBeInTheDocument();
    });

    it('TODO-016: 단일 일정에서 반복 일정으로 수정하면 아이콘이 나타난다', async () => {
      // 명세: REQ-005
      // 설계: TODO-016
      expect.hasAssertions();

      // Arrange - 기존 단일 일정
      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [existingEvent] });
        }),
        http.put('/api/events/:id', async ({ request }) => {
          const updatedEvent = (await request.json()) as Event;
          return HttpResponse.json(updatedEvent);
        })
      );

      // Act - 앱 렌더링 및 일정 수정
      render(<App />);

      // 기존 일정 로드 대기
      // await waitFor(() => {
      //   expect(screen.getByText(/기존 회의/)).toBeInTheDocument();
      // });

      // 수정 버튼 클릭
      // const editButton = screen.getByLabelText('Edit event');
      // await user.click(editButton);

      // 반복 설정으로 변경
      // const repeatCheckbox = screen.getByLabelText('반복 일정');
      // await user.click(repeatCheckbox);

      // const repeatTypeSelect = screen.getByLabelText('반복 유형');
      // await user.click(repeatTypeSelect);
      // await user.click(screen.getByText('매일'));

      // const submitButton = screen.getByTestId('event-submit-button');
      // await user.click(submitButton);

      // Assert - 주석 처리
      // await waitFor(() => {
      //   expect(enqueueSnackbarFn).toHaveBeenCalledWith(
      //     expect.stringContaining('일정이 수정되었습니다'),
      //     expect.anything()
      //   );
      // });

      // const eventList = screen.getByTestId('event-list');
      // expect(within(eventList).getByLabelText('반복 일정')).toBeInTheDocument();
    });

    it('TODO-017: 반복 일정에서 단일 일정으로 수정하면 아이콘이 사라진다', async () => {
      // 명세: REQ-005
      // 설계: TODO-017
      expect.hasAssertions();

      // Arrange - 기존 반복 일정
      const recurringEvent: Event = {
        ...existingEvent,
        title: '반복 회의',
        repeat: { type: 'daily', interval: 1, endDate: '2025-12-31' },
      };

      server.use(
        http.get('/api/events', () => {
          return HttpResponse.json({ events: [recurringEvent] });
        }),
        http.put('/api/events/:id', async ({ request }) => {
          const updatedEvent = (await request.json()) as Event;
          return HttpResponse.json(updatedEvent);
        })
      );

      // Act - 앱 렌더링 및 일정 수정
      render(<App />);

      // 기존 일정 로드 대기
      // await waitFor(() => {
      //   expect(screen.getByText(/반복 회의/)).toBeInTheDocument();
      // });

      // 반복 아이콘 존재 확인
      // const eventList = screen.getByTestId('event-list');
      // expect(within(eventList).getByLabelText('반복 일정')).toBeInTheDocument();

      // 수정 버튼 클릭
      // const editButton = screen.getByLabelText('Edit event');
      // await user.click(editButton);

      // 반복 설정 해제
      // const repeatCheckbox = screen.getByLabelText('반복 일정');
      // await user.click(repeatCheckbox); // 체크 해제

      // const submitButton = screen.getByTestId('event-submit-button');
      // await user.click(submitButton);

      // Assert - 주석 처리
      // await waitFor(() => {
      //   expect(enqueueSnackbarFn).toHaveBeenCalledWith(
      //     expect.stringContaining('일정이 수정되었습니다'),
      //     expect.anything()
      //   );
      // });

      // const eventListAfter = screen.getByTestId('event-list');
      // expect(within(eventListAfter).queryByLabelText('반복 일정')).not.toBeInTheDocument();
    });
  });
});

