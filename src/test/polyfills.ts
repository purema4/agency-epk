// jsdom has no AnimationEvent, which makes React DOM listen for "webkitAnimationEnd"
// instead of "animationend". Must load before react-dom.
if (typeof window.AnimationEvent === "undefined") {
  window.AnimationEvent = class AnimationEvent extends Event {} as unknown as typeof window.AnimationEvent;
}
