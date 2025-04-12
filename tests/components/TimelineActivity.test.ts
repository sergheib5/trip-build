import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineActivity from '../../src/components/TimelineView/TimelineActivity.vue'

describe('TimelineActivity', () => {
  const mockActivity = {
    id: '1',
    title: 'Test Activity',
    startTime: new Date('2024-04-12T10:00:00'),
    endTime: new Date('2024-04-12T11:00:00'),
    location: 'Test Location',
  }

  it('renders correctly with activity data', () => {
    const wrapper = mount(TimelineActivity, {
      props: {
        activity: mockActivity,
      },
    })

    expect(wrapper.find('.activity-block').exists()).toBe(true)
    expect(wrapper.find('h4').text()).toBe(mockActivity.title)
    expect(wrapper.find('.location').text()).toBe(mockActivity.location)
    expect(wrapper.find('.time').exists()).toBe(true)
  })

  it('emits edit event when clicked', async () => {
    const wrapper = mount(TimelineActivity, {
      props: {
        activity: mockActivity,
      },
    })

    await wrapper.find('.activity-block').trigger('click')
    const emitted = wrapper.emitted('edit')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[0][0]).toEqual(mockActivity)
    }
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(TimelineActivity, {
      props: {
        activity: mockActivity,
      },
    })

    await wrapper.find('.delete-button').trigger('click')
    const emitted = wrapper.emitted('delete')
    expect(emitted).toBeTruthy()
    if (emitted) {
      expect(emitted[0][0]).toEqual(mockActivity)
    }
  })

  it('emits resize-start event when resize handle is clicked', async () => {
    const wrapper = mount(TimelineActivity, {
      props: {
        activity: mockActivity,
      },
    })

    await wrapper.find('.resize-handle').trigger('mousedown')
    expect(wrapper.emitted('resize-start')).toBeTruthy()
  })

  it('applies correct styles based on activity times', () => {
    const wrapper = mount(TimelineActivity, {
      props: {
        activity: mockActivity,
      },
    })

    const style = wrapper.find('.activity-block').attributes('style')
    expect(style).toContain('top')
    expect(style).toContain('height')
  })

  it('applies resizing styles when isResizing is true', () => {
    const wrapper = mount(TimelineActivity, {
      props: {
        activity: mockActivity,
        isResizing: true,
        resizingActivityId: mockActivity.id,
      },
    })

    const style = wrapper.find('.activity-block').attributes('style')
    expect(style).toContain('border: 2px solid #1a73e8')
  })
}) 