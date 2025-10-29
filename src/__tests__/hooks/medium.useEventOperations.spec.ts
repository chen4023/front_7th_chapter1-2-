import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
    }),
  };
});

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newEvent: Event = {
    id: '1',
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2025-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999', // 존재하지 않는 ID
    title: '존재하지 않는 이벤트',
    date: '2025-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

  expect(result.current.events).toHaveLength(1);
});

describe('REQ-001: 반복 유형 선택 - Data Persistence', () => {
  describe('Phase 4: Data Persistence Verification', () => {
    describe('Group 4.1: Save and Retrieve', () => {
      it('"매일" 반복으로 저장된 일정 조회 시 repeat.type이 "daily"다', async () => {
        // 명세: REQ-001 - 매일 반복 데이터 저장
        // 설계: TODO-015

        // Arrange
        setupMockHandlerCreation();
        const { result } = renderHook(() => useEventOperations(false));

        await act(() => Promise.resolve(null));

        const dailyEvent: Event = {
          id: '1',
          title: '매일 운동',
          date: '2025-01-01',
          startTime: '07:00',
          endTime: '08:00',
          description: '아침 운동',
          location: '헬스장',
          category: '개인',
          repeat: { type: 'daily', interval: 1 },
          notificationTime: 10,
        };

        // Act
        await act(async () => {
          await result.current.saveEvent(dailyEvent);
        });

        // Assert
        expect(result.current.events[0].repeat.type).toBe('daily');
      });

      it('"매주" 반복으로 저장된 일정 조회 시 repeat.type이 "weekly"다', async () => {
        // 명세: REQ-001 - 매주 반복 데이터 저장
        // 설계: TODO-016

        // Arrange
        setupMockHandlerCreation();
        const { result } = renderHook(() => useEventOperations(false));

        await act(() => Promise.resolve(null));

        const weeklyEvent: Event = {
          id: '1',
          title: '주간 회의',
          date: '2025-01-06',
          startTime: '14:00',
          endTime: '15:00',
          description: '팀 주간 회의',
          location: '회의실 B',
          category: '업무',
          repeat: { type: 'weekly', interval: 1 },
          notificationTime: 10,
        };

        // Act
        await act(async () => {
          await result.current.saveEvent(weeklyEvent);
        });

        // Assert
        expect(result.current.events[0].repeat.type).toBe('weekly');
      });

      it('"매월" 반복으로 저장된 일정 조회 시 repeat.type이 "monthly"다', async () => {
        // 명세: REQ-001 - 매월 반복 데이터 저장
        // 설계: TODO-017

        // Arrange
        setupMockHandlerCreation();
        const { result } = renderHook(() => useEventOperations(false));

        await act(() => Promise.resolve(null));

        const monthlyEvent: Event = {
          id: '1',
          title: '월간 리뷰',
          date: '2025-01-15',
          startTime: '10:00',
          endTime: '11:00',
          description: '월간 성과 리뷰',
          location: '대회의실',
          category: '업무',
          repeat: { type: 'monthly', interval: 1 },
          notificationTime: 10,
        };

        // Act
        await act(async () => {
          await result.current.saveEvent(monthlyEvent);
        });

        // Assert
        expect(result.current.events[0].repeat.type).toBe('monthly');
      });

      it('"매년" 반복으로 저장된 일정 조회 시 repeat.type이 "yearly"다', async () => {
        // 명세: REQ-001 - 매년 반복 데이터 저장
        // 설계: TODO-018

        // Arrange
        setupMockHandlerCreation();
        const { result } = renderHook(() => useEventOperations(false));

        await act(() => Promise.resolve(null));

        const yearlyEvent: Event = {
          id: '1',
          title: '생일',
          date: '2025-03-15',
          startTime: '00:00',
          endTime: '23:59',
          description: '내 생일',
          location: '',
          category: '개인',
          repeat: { type: 'yearly', interval: 1 },
          notificationTime: 1440,
        };

        // Act
        await act(async () => {
          await result.current.saveEvent(yearlyEvent);
        });

        // Assert
        expect(result.current.events[0].repeat.type).toBe('yearly');
      });

      it('비반복으로 저장된 일정 조회 시 repeat.type이 "none"이다', async () => {
        // 명세: REQ-001 - 비반복 데이터 저장
        // 설계: TODO-019

        // Arrange
        setupMockHandlerCreation();
        const { result } = renderHook(() => useEventOperations(false));

        await act(() => Promise.resolve(null));

        const nonRecurringEvent: Event = {
          id: '1',
          title: '회의',
          date: '2025-01-15',
          startTime: '09:00',
          endTime: '10:00',
          description: '팀 미팅',
          location: '회의실 A',
          category: '업무',
          repeat: { type: 'none', interval: 0 },
          notificationTime: 10,
        };

        // Act
        await act(async () => {
          await result.current.saveEvent(nonRecurringEvent);
        });

        // Assert
        expect(result.current.events[0].repeat.type).toBe('none');
      });
    });
  });
});
