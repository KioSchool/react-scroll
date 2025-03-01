import throttle from "lodash.throttle";
import {addPassiveEventListener, removePassiveEventListener} from './passive-event-listeners';

// The eventHandler will execute at a rate of 15fps by default
const eventThrottler = (eventHandler, throttleAmount = 66)  => throttle(eventHandler, throttleAmount);

const scrollSpy = {

  spyCallbacks: [],
  spySetState: [],
  scrollSpyContainers: [],

  mount(scrollSpyContainer, throttle) {
    if (scrollSpyContainer) {
      const basicEventHandler = () => {
        scrollSpy.scrollHandler(scrollSpyContainer);
      }
      const throttleEventHandler = eventThrottler((event) => {
        scrollSpy.scrollHandler(scrollSpyContainer);
      }, throttle);

      const scrollHandler = throttle ? throttleEventHandler : basicEventHandler;
      scrollSpy.scrollSpyContainers.push(scrollSpyContainer);
      addPassiveEventListener(scrollSpyContainer, 'scroll', scrollHandler);
      return () => {
        removePassiveEventListener(scrollSpyContainer, 'scroll', scrollHandler);
        scrollSpy.scrollSpyContainers.splice(scrollSpy.scrollSpyContainers.indexOf(scrollSpyContainer), 1);
      };
    }
    return () => {};
  },

  isMounted(scrollSpyContainer) {
    return scrollSpy.scrollSpyContainers.indexOf(scrollSpyContainer) !== -1;
  },

  currentPositionX(scrollSpyContainer) {
    if(scrollSpyContainer === document) {
      let supportPageOffset = window.scrollY !== undefined;
      let isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
      return supportPageOffset ? window.scrollX : isCSS1Compat ?
          document.documentElement.scrollLeft : document.body.scrollLeft;
    } else {
      return scrollSpyContainer.scrollLeft;
    }
  },

  currentPositionY(scrollSpyContainer) {
    if(scrollSpyContainer === document) {
      let supportPageOffset = window.scrollX !== undefined;
      let isCSS1Compat = ((document.compatMode || "") === "CSS1Compat");
      return supportPageOffset ? window.scrollY : isCSS1Compat ?
      document.documentElement.scrollTop : document.body.scrollTop;
    } else {
      return scrollSpyContainer.scrollTop;
    }
  },

  scrollHandler(scrollSpyContainer) {
    let callbacks = scrollSpy.scrollSpyContainers[scrollSpy.scrollSpyContainers.indexOf(scrollSpyContainer)].spyCallbacks || [];
    callbacks.forEach(c => c(scrollSpy.currentPositionX(scrollSpyContainer), scrollSpy.currentPositionY(scrollSpyContainer)));
  },

  addStateHandler(handler) {
    scrollSpy.spySetState.push(handler);
  },

  addSpyHandler(handler, scrollSpyContainer) {
    let container = scrollSpy.scrollSpyContainers[scrollSpy.scrollSpyContainers.indexOf(scrollSpyContainer)];

    if(!container.spyCallbacks) {
      container.spyCallbacks = [];
    }

    container.spyCallbacks.push(handler);
  },

  updateStates() {
    scrollSpy.spySetState.forEach(s => s());
  },

  unmount(stateHandler, spyHandler) {
    scrollSpy.scrollSpyContainers.forEach(c => c.spyCallbacks && c.spyCallbacks.length && c.spyCallbacks.indexOf(spyHandler) > -1 && c.spyCallbacks.splice(c.spyCallbacks.indexOf(spyHandler), 1))

    if(scrollSpy.spySetState && scrollSpy.spySetState.length && scrollSpy.spySetState.indexOf(stateHandler) > -1) {
      scrollSpy.spySetState.splice(scrollSpy.spySetState.indexOf(stateHandler), 1);
    }

    document.removeEventListener('scroll', scrollSpy.scrollHandler);
  },

  update: () => scrollSpy.scrollSpyContainers.forEach(c => scrollSpy.scrollHandler(c))
}

export default scrollSpy;
