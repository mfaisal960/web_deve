const initialState = {
  events: [],
  allEvents: [],
  loading: false,
  error: null,
  success: false,
};

export const eventReducer = (state = initialState, action) => {
  switch (action.type) {
    case "eventCreateRequest":
      return {
        ...state,
        loading: true,
        success: false,
        error: null,
      };
    case "eventCreateSuccess":
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
        events: [action.payload, ...state.events],
        allEvents: [action.payload, ...state.allEvents],
      };
    case "eventCreateFail":
      return {
        ...state,
        loading: false,
        success: false,
        error: action.payload,
      };
    case "deleteeventRequest":
      return {
        ...state,
        loading: true,
      };
    case "deleteeventSuccess":
      return {
        ...state,
        loading: false,
        success: true,
      };
    case "deleteeventFailed":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case "getAlleventsShopRequest":
    case "getAllEventsRequest":
      return {
        ...state,
        loading: true,
        success: false,
      };
    case "getAlleventsShopSuccess":
      return {
        ...state,
        events: action.payload,
        loading: false,
        success: false,
      };
    case "getAllEventsSuccess":
      return {
        ...state,
        events: action.payload,
        allEvents: action.payload,
        loading: false,
        success: false,
      };
    case "getAlleventsShopFailed":
    case "getAllEventsFailed":
      return {
        ...state,
        error: action.payload,
        loading: false,
        success: false,
      };
    case "clearErrors":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};
