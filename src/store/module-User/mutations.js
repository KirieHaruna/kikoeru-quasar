const mutations = {
  INIT (state, user) {
    state.name = user.name
    state.group = user.group
    state.displayLrcFile = user.displayLrcFile
  },
  
  SET_AUTH (state, flag) {
    state.auth = flag
  },

  DISPLAY_LRC_FILE (state, flag) {
    state.displayLrcFile = flag
  }
}

export default mutations