import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineView from '../../src/components/TimelineView/TimelineView.vue'

describe('TimelineView', () => {
  // Create a mock activity for today
  const today = new Date()
  const mockActivities = [
    {
      id: '1',
      title: 'Test Activity',
      startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
      location: 'Test Location',
    },
  ]

  it('renders correctly with default props', () => {
    const wrapper = mount(TimelineView, {
      props: {
        activities: mockActivities,
      },
    })

    expect(wrapper.find('.timeline-container').exists()).toBe(true)
    expect(wrapper.find('.calendar-grid').exists()).toBe(true)
    expect(wrapper.find('.day-headers').exists()).toBe(true)
    expect(wrapper.find('.time-grid').exists()).toBe(true)
  })

  it('renders activities correctly', () => {
    const wrapper = mount(TimelineView, {
      props: {
        activities: mockActivities,
      },
    })

    const activityBlocks = wrapper.findAll('.activity-block')
    expect(activityBlocks.length).toBe(mockActivities.length)
    
    const firstActivity = activityBlocks[0]
    expect(firstActivity.find('h4').text()).toBe(mockActivities[0].title)
    expect(firstActivity.find('.location').text()).toBe(mockActivities[0].location)
  })

  it('handles week navigation', async () => {
    const wrapper = mount(TimelineView, {
      props: {
        activities: mockActivities,
      },
    })

    const prevButton = wrapper.find('.prev-button')
    const nextButton = wrapper.find('.next-button')

    await prevButton.trigger('click')
    await nextButton.trigger('click')

    // Verify that the component doesn't throw errors during navigation
    expect(wrapper.find('.calendar-grid').exists()).toBe(true)
  })

  it('handles expanded view', () => {
    const wrapper = mount(TimelineView, {
      props: {
        activities: mockActivities,
        isExpanded: true,
      },
    })

    expect(wrapper.find('.calendar-grid').classes()).toContain('expanded-view')
  })

  it('emits update:activities when activities are modified', async () => {
    const wrapper = mount(TimelineView, {
      props: {
        activities: mockActivities,
      },
    })

    // Wait for the activity to be rendered
    await wrapper.vm.$nextTick()

    const deleteButton = wrapper.find('.delete-button')
    await deleteButton.trigger('click')

    expect(wrapper.emitted('update:activities')).toBeTruthy()
  })
}) 