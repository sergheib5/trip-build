import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimelineControls from '../../src/components/TimelineView/TimelineControls.vue'

describe('TimelineControls', () => {
  it('renders correctly with default props', () => {
    const wrapper = mount(TimelineControls)

    expect(wrapper.find('.timeline-controls').exists()).toBe(true)
    expect(wrapper.find('.expand-button').exists()).toBe(true)
    expect(wrapper.find('.filter-button').exists()).toBe(true)
  })

  it('renders expand button with correct text when not expanded', () => {
    const wrapper = mount(TimelineControls, {
      props: {
        isExpanded: false,
      },
    })

    const expandButton = wrapper.find('.expand-button')
    expect(expandButton.find('.expand-icon').text()).toBe('⊕')
    expect(expandButton.find('.expand-text').text()).toBe('Expand View')
  })

  it('renders expand button with correct text when expanded', () => {
    const wrapper = mount(TimelineControls, {
      props: {
        isExpanded: true,
      },
    })

    const expandButton = wrapper.find('.expand-button')
    expect(expandButton.find('.expand-icon').text()).toBe('⊖')
    expect(expandButton.find('.expand-text').text()).toBe('Compact View')
  })

  it('emits toggle-expand event when expand button is clicked', async () => {
    const wrapper = mount(TimelineControls)

    await wrapper.find('.expand-button').trigger('click')
    expect(wrapper.emitted('toggle-expand')).toBeTruthy()
  })

  it('emits toggle-filters event when filter button is clicked', async () => {
    const wrapper = mount(TimelineControls)

    await wrapper.find('.filter-button').trigger('click')
    expect(wrapper.emitted('toggle-filters')).toBeTruthy()
  })

  it('applies active class to expand button when isExpanded is true', () => {
    const wrapper = mount(TimelineControls, {
      props: {
        isExpanded: true,
      },
    })

    expect(wrapper.find('.expand-button').classes()).toContain('active')
  })

  it('hides button text on mobile view', () => {
    const wrapper = mount(TimelineControls)
    
    // Simulate mobile view by setting window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      value: 480,
      writable: true,
    })
    
    // Trigger resize event
    window.dispatchEvent(new Event('resize'))
    
    const expandText = wrapper.find('.expand-text')
    const filterText = wrapper.find('.filter-text')
    
    expect(expandText.isVisible()).toBe(false)
    expect(filterText.isVisible()).toBe(false)
  })
}) 