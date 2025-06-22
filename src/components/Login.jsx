import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Lock,
  Mail,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd,
} from "@mui/icons-material";
import { authService } from "../services/axiosAuthService";

const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  width: "100vw",
  background: theme.palette.background.default,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  margin: 0,
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
}));

const LoginCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  width: "100%",
  maxWidth: "420px",
  minWidth: "320px",
  boxShadow: theme.shadows[4],
  margin: theme.spacing(2),
}));

const LoginHeader = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginBottom: theme.spacing(3),
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  marginBottom: theme.spacing(1),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiOutlinedInput-root": {
    backgroundColor: theme.palette.background.paper,
    "& input": {
      paddingLeft: theme.spacing(6),
      color: theme.palette.text.primary,
      // Override browser autofill styling
      "&:-webkit-autofill": {
        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
        backgroundColor: `${theme.palette.background.paper} !important`,
        caretColor: theme.palette.text.primary,
        transition: "background-color 5000s ease-in-out 0s",
      },
      "&:-webkit-autofill:hover": {
        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
      },
      "&:-webkit-autofill:focus": {
        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
      },
      "&:-webkit-autofill:active": {
        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.background.paper} inset !important`,
        WebkitTextFillColor: `${theme.palette.text.primary} !important`,
      },
    },
    "&.Mui-focused": {
      backgroundColor: theme.palette.background.paper,
      "& .MuiInputAdornment-root svg": {
        color: theme.palette.primary.main,
        transform: "scale(1.1)",
      },
    },
    "& fieldset": {
      borderColor: theme.palette.divider,
    },
    "&:hover fieldset": {
      borderColor: theme.palette.text.secondary,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.main,
    },
  },
  "& .MuiInputAdornment-root": {
    position: "absolute",
    left: theme.spacing(2),
    "& svg": {
      transition: "all 0.3s ease",
      color: theme.palette.text.disabled,
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    "&.Mui-focused": {
      color: theme.palette.primary.main,
    },
  },
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  width: "100%",
  padding: `${theme.spacing(1.5)} ${theme.spacing(2)}`,
  fontSize: "1rem",
  fontWeight: 600,
  borderRadius: theme.spacing(1),
  marginTop: theme.spacing(2),
  position: "relative",
  overflow: "hidden",
  transition: "all 0.3s ease",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: "-100%",
    width: "100%",
    height: "100%",
    background:
      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)",
    transition: "left 0.5s ease",
  },
  "&:hover::before": {
    left: "100%",
  },
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: theme.shadows[3],
  },
  "&:active": {
    transform: "translateY(0)",
    boxShadow: theme.shadows[2],
  },
  "&.loading": {
    opacity: 0.8,
    transform: "none",
    "&:hover": {
      transform: "none",
      boxShadow: theme.shadows[1],
    },
    "&::before": {
      display: "none",
    },
  },
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1),
  animation: "errorSlideIn 0.3s ease-out",
  backdropFilter: "blur(10px)",
  "@keyframes errorSlideIn": {
    from: {
      opacity: 0,
      transform: "translateY(-10px)",
    },
    to: {
      opacity: 1,
      transform: "translateY(0)",
    },
  },
}));

const LoginFooter = styled(Box)(({ theme }) => ({
  textAlign: "center",
  marginTop: theme.spacing(3),
}));

const LinkButton = styled(Button)(({ theme }) => ({
  background: "none",
  border: "none",
  color: theme.palette.primary.main,
  cursor: "pointer",
  textDecoration: "underline",
  fontSize: "inherit",
  marginLeft: theme.spacing(0.5),
  padding: 0,
  minWidth: "auto",
  "&:hover": {
    color: theme.palette.secondary.main,
    textDecoration: "underline",
    background: "none",
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiTab-root": {
    minWidth: "50%",
    textTransform: "none",
    fontWeight: 500,
  },
}));

const Login = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");

  const isLogin = activeTab === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let response;
      if (isLogin) {
        response = await authService.login(formData.email, formData.password);
      } else {
        response = await authService.register(formData);
      }

      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      }
    } catch (error) {
      setError(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError("");
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <StyledTypography variant="h4" component="h1">
            Steel Invoice Pro
          </StyledTypography>
          <Typography variant="body1" color="text.secondary">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </Typography>
        </LoginHeader>

        <StyledTabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </StyledTabs>

        <Box component="form" onSubmit={handleSubmit}>
          {!isLogin && (
            <StyledTextField
              fullWidth
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonAdd />
                  </InputAdornment>
                ),
              }}
            />
          )}

          <StyledTextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail />
                </InputAdornment>
              ),
            }}
          />

          <StyledTextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleInputChange}
            required
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{
                      color: "text.disabled",
                      "&:hover": {
                        color: "text.primary",
                        backgroundColor: "rgba(255, 107, 53, 0.1)",
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {!isLogin && (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                label="Role"
                onChange={handleInputChange}
                sx={{
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "divider",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "grey.400",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          )}

          {error && <StyledAlert severity="error">{error}</StyledAlert>}

          <AnimatedButton
            type="submit"
            variant="contained"
            disabled={loading}
            className={loading ? "loading" : ""}
            startIcon={
              loading ? (
                <CircularProgress size={16} color="inherit" />
              ) : isLogin ? (
                <LoginIcon />
              ) : (
                <PersonAdd />
              )
            }
          >
            {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
          </AnimatedButton>
        </Box>

        <LoginFooter>
          <Typography variant="body2" color="text.secondary">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <LinkButton onClick={() => setActiveTab(isLogin ? 1 : 0)}>
              {isLogin ? "Sign up" : "Sign in"}
            </LinkButton>
          </Typography>
        </LoginFooter>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
