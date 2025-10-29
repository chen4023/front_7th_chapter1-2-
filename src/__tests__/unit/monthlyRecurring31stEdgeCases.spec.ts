import { describe, expect, it } from 'vitest';

import { EventForm } from '../../types';
import { generateMonthlyRecurringEvents } from '../../utils/dateUtils';

/**
 * REQ-002: 매월 반복 - 31일 처리 - Edge Cases
 *
 * 윤년/평년, 연도 경계, 다양한 시작일 등의 Edge Case 테스트
 */

describe('매월 반복 - 31일 처리 - Edge Cases', () => {
  describe('윤년/평년 2월 처리', () => {
    // TODO-011: 31일 매월 반복 - 윤년 2월 건너뛰기 (2024년) (15분)
    it('윤년(2월 29일)에도 31일 매월 반복이 2월을 건너뛰어야 한다', () => {
      // 명세: REQ-002, EDGE-001 - "2월은 28/29일까지"
      // 설계: TODO-011
      expect.hasAssertions();

      // Arrange - 2024년은 윤년
      const eventForm: EventForm = {
        title: '월말 보고',
        date: '2024-01-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 말일 보고서 제출',
        location: '본사',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2024-03-31',
        },
        notificationTime: 10,
      };

      // Act
      const events = generateMonthlyRecurringEvents(eventForm);

      // Assert
      expect(events).toHaveLength(2);
      expect(events[0].date).toBe('2024-01-31');
      expect(events[1].date).toBe('2024-03-31');
      // 윤년이지만 2024-02-31은 생성되지 않음 (2월은 29일까지)
      const dates = events.map((e) => e.date);
      expect(dates).not.toContain('2024-02-31');
      expect(dates).not.toContain('2024-02-29'); // 대체 생성 없음
    });

    // TODO-012: 31일 매월 반복 - 평년 2월 건너뛰기 (2025년) (10분)
    it('평년(2월 28일)에 31일 매월 반복이 2월을 건너뛰어야 한다', () => {
      // 명세: REQ-002, EDGE-001
      // 설계: TODO-012
      expect.hasAssertions();

      // Arrange - 2025년은 평년
      const eventForm: EventForm = {
        title: '월말 보고',
        date: '2025-01-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 말일 보고서 제출',
        location: '본사',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-03-31',
        },
        notificationTime: 10,
      };

      // Act
      const events = generateMonthlyRecurringEvents(eventForm);

      // Assert
      expect(events).toHaveLength(2);
      expect(events[0].date).toBe('2025-01-31');
      expect(events[1].date).toBe('2025-03-31');
      // 2025-02-31이 생성되지 않음
      const dates = events.map((e) => e.date);
      expect(dates).not.toContain('2025-02-31');
      expect(dates).not.toContain('2025-02-28'); // 대체 생성 없음
    });
  });

  describe('연도 경계 및 다양한 시작일', () => {
    // TODO-013: 31일 매월 반복 - 연말 경계 (12월 → 다음해 1월) (15분)
    it('연도가 바뀌는 경우를 올바르게 처리해야 한다 (12월 31일 → 1월 31일)', () => {
      // 명세: REQ-002, EDGE-001
      // 설계: TODO-013
      expect.hasAssertions();

      // Arrange
      const eventForm: EventForm = {
        title: '월말 보고',
        date: '2024-12-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 말일 보고서 제출',
        location: '본사',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-03-31',
        },
        notificationTime: 10,
      };

      // Act
      const events = generateMonthlyRecurringEvents(eventForm);

      // Assert
      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2024-12-31'); // 2024년
      expect(events[1].date).toBe('2025-01-31'); // 2025년 1월
      expect(events[2].date).toBe('2025-03-31'); // 2025년 3월
      // 2025-02-31 생성 안 됨
      const dates = events.map((e) => e.date);
      expect(dates).not.toContain('2025-02-31');
      // 연도가 올바르게 증가하는지 확인
      expect(new Date(events[0].date).getFullYear()).toBe(2024);
      expect(new Date(events[1].date).getFullYear()).toBe(2025);
      expect(new Date(events[2].date).getFullYear()).toBe(2025);
    });

    // TODO-014: 31일 매월 반복 - 종료일이 31일 아닌 경우 (10분)
    it('종료일이 31일이 아닌 경우에도 정상 동작해야 한다', () => {
      // 명세: REQ-002, REQ-006 (종료 조건)
      // 설계: TODO-014
      expect.hasAssertions();

      // Arrange - 종료일이 6월 15일 (31일이 아님)
      const eventForm: EventForm = {
        title: '월말 보고',
        date: '2025-01-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 말일 보고서 제출',
        location: '본사',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-06-15',
        },
        notificationTime: 10,
      };

      // Act
      const events = generateMonthlyRecurringEvents(eventForm);

      // Assert
      expect(events).toHaveLength(3);
      expect(events[0].date).toBe('2025-01-31');
      expect(events[1].date).toBe('2025-03-31');
      expect(events[2].date).toBe('2025-05-31');
      // 2025-06-31은 종료일(2025-06-15) 이후이므로 생성 안 됨
      const dates = events.map((e) => e.date);
      expect(dates).not.toContain('2025-06-31');
      // 마지막 이벤트가 종료일 이전인지 확인
      const lastEvent = events[events.length - 1];
      expect(new Date(lastEvent.date).getTime()).toBeLessThanOrEqual(
        new Date('2025-06-15').getTime()
      );
    });

    // TODO-015: 31일 매월 반복 - 시작일이 3월 31일 (10분)
    it('1월이 아닌 다른 31일에서 시작하는 경우 (3월 31일)', () => {
      // 명세: REQ-002, EDGE-001
      // 설계: TODO-015
      expect.hasAssertions();

      // Arrange
      const eventForm: EventForm = {
        title: '월말 보고',
        date: '2025-03-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 말일 보고서 제출',
        location: '본사',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-12-31',
        },
        notificationTime: 10,
      };

      // Act
      const events = generateMonthlyRecurringEvents(eventForm);

      // Assert
      expect(events).toHaveLength(6); // 3, 5, 7, 8, 10, 12월
      // 생성 시작이 3월 31일인지 확인
      expect(events[0].date).toBe('2025-03-31');
      // 1월, 2월은 과거이므로 생성 안 됨
      const dates = events.map((e) => e.date);
      expect(dates).not.toContain('2025-01-31');
      expect(dates).not.toContain('2025-02-31');
      // 4, 6, 9, 11월 건너뛰기
      expect(dates).not.toContain('2025-04-31');
      expect(dates).not.toContain('2025-06-31');
      expect(dates).not.toContain('2025-09-31');
      expect(dates).not.toContain('2025-11-31');
      // 예상 날짜 확인
      const expectedDates = [
        '2025-03-31',
        '2025-05-31',
        '2025-07-31',
        '2025-08-31',
        '2025-10-31',
        '2025-12-31',
      ];
      expect(dates).toEqual(expectedDates);
    });

    // TODO-016: 31일 매월 반복 - 시작일이 8월 31일 (연속 31일 달) (5분)
    it('7월(31일) → 8월(31일) 연속으로 31일 있는 경우', () => {
      // 명세: REQ-002, EDGE-001
      // 설계: TODO-016
      expect.hasAssertions();

      // Arrange
      const eventForm: EventForm = {
        title: '월말 보고',
        date: '2025-08-31',
        startTime: '09:00',
        endTime: '10:00',
        description: '매월 말일 보고서 제출',
        location: '본사',
        category: '업무',
        repeat: {
          type: 'monthly',
          interval: 1,
          endDate: '2025-12-31',
        },
        notificationTime: 10,
      };

      // Act
      const events = generateMonthlyRecurringEvents(eventForm);

      // Assert
      expect(events).toHaveLength(3); // 8, 10, 12월
      expect(events[0].date).toBe('2025-08-31');
      expect(events[1].date).toBe('2025-10-31');
      expect(events[2].date).toBe('2025-12-31');
      // 9월(30일), 11월(30일) 건너뛰기 확인
      const dates = events.map((e) => e.date);
      expect(dates).not.toContain('2025-09-31');
      expect(dates).not.toContain('2025-11-31');
    });
  });
});
