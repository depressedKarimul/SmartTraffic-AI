import { StyleSheet } from "react-native";

export const colors = {
  background: "#0A0E1A",
  card: "#141828",
  cardAlt: "#1E2438",
  primary: "#00D4FF",
  success: "#00E676",
  warning: "#FFD600",
  danger: "#FF1744",
  text: "#FFFFFF",
  textMuted: "#8892A4",
  border: "#2A3550"
};

export const typography = {
  headerLarge: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text
  },
  headerMed: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text
  },
  body: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.text
  },
  caption: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted
  },
  predictionNumber: {
    fontSize: 60,
    fontWeight: "700",
    color: colors.text
  }
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32
};

export const radii = {
  card: 16,
  button: 14,
  pill: 999
};

export const shadow = {
  shadowColor: "#000000",
  shadowOffset: {
    width: 0,
    height: 10
  },
  shadowOpacity: 0.22,
  shadowRadius: 18,
  elevation: 8
};

export const styles = StyleSheet.create({
  flex: {
    flex: 1
  }
});
