import api from "./axiosApi";

const devService = {
  getGitHubStatus() {
    return api.get("/dev/github/status");
  },

  disconnectGitHub() {
    return api.post("/dev/github/disconnect");
  },

  getDependabotPrs() {
    return api.get("/dev/dependabot");
  },

  dismissPr(number, repo) {
    return api.post(`/dev/dependabot/${number}/dismiss`, { repo });
  },

  getDependencyAudit() {
    return api.get("/dev/dependency-audit");
  },
};

export default devService;
