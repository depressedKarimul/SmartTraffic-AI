import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { askChatbot } from "../services/api";

const suggestions = [
  "🚗 No licence fine?",
  "🔴 Red light penalty?",
  "⛑️ Helmet rules?"
];

const getCurrentTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const createWelcomeMessage = () => ({
  id: "welcome",
  sender: "bot",
  text:
    "👋 Assalamu Alaikum! I am your Bangladesh Traffic Law Assistant.\n\n" +
    "Ask me about fines, licences, violations, or any Road Transport Act question.",
  timestamp: getCurrentTime()
});

function TypingDots() {
  const dotAnimations = useRef([
    new Animated.Value(0.3),
    new Animated.Value(0.3),
    new Animated.Value(0.3)
  ]).current;

  useEffect(() => {
    const loops = dotAnimations.map((animation, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(animation, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true
          }),
          Animated.timing(animation, {
            toValue: 0.3,
            duration: 250,
            useNativeDriver: true
          })
        ])
      )
    );

    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [dotAnimations]);

  return (
    <View style={styles.typingRow}>
      {dotAnimations.map((animation, index) => (
        <Animated.View
          key={String(index)}
          style={[styles.typingDot, { opacity: animation }]}
        />
      ))}
    </View>
  );
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef(null);

  const showSuggestions =
    messages.length === 1 && messages[0]?.id === "welcome" && !isLoading;
  const canSend = input.trim().length > 0 && !isLoading;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([createWelcomeMessage()]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [isOpen, messages, isLoading]);

  const sendMessage = async (messageText) => {
    const cleanMessage = messageText.trim();
    if (!cleanMessage || isLoading) {
      return;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: cleanMessage,
      timestamp: getCurrentTime()
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsLoading(true);

    const response = await askChatbot(cleanMessage);
    const botMessage = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: response.reply,
      timestamp: getCurrentTime()
    };

    setMessages((currentMessages) => [...currentMessages, botMessage]);
    setIsLoading(false);
  };

  const renderMessage = (message) => {
    const isUser = message.sender === "user";

    return (
      <View
        key={message.id}
        style={[
          styles.messageBlock,
          isUser ? styles.userMessageBlock : styles.botMessageBlock
        ]}
      >
        <View style={styles.messageRow}>
          {!isUser && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>AI</Text>
            </View>
          )}
          <View
            style={[
              styles.bubble,
              isUser ? styles.userBubble : styles.botBubble
            ]}
          >
            <Text style={isUser ? styles.userBubbleText : styles.botBubbleText}>
              {message.text}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.timestamp,
            isUser ? styles.userTimestamp : styles.botTimestamp
          ]}
        >
          {message.timestamp}
        </Text>
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.floatingButton}
        onPress={() => setIsOpen((currentValue) => !currentValue)}
      >
        <Ionicons
          name={isOpen ? "close" : "chatbubble-ellipses"}
          color="#0A0E1A"
          size={28}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardView}
          >
            <View style={styles.sheet}>
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <Ionicons name="hardware-chip" size={24} color="#00D4FF" />
                  <View style={styles.headerTextGroup}>
                    <Text style={styles.headerTitle}>Traffic Law AI</Text>
                    <Text style={styles.headerSubtitle}>
                      Bangladesh Road Transport Act 2018
                    </Text>
                  </View>
                </View>
                <Pressable
                  hitSlop={10}
                  style={styles.closeButton}
                  onPress={() => setIsOpen(false)}
                >
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                keyboardShouldPersistTaps="handled"
              >
                {messages.map(renderMessage)}

                {showSuggestions && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.suggestionScroller}
                  >
                    {suggestions.map((suggestion) => (
                      <TouchableOpacity
                        key={suggestion}
                        activeOpacity={0.8}
                        style={styles.suggestionChip}
                        onPress={() => sendMessage(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {isLoading && (
                  <View style={[styles.messageBlock, styles.botMessageBlock]}>
                    <View style={styles.messageRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>AI</Text>
                      </View>
                      <View style={[styles.bubble, styles.botBubble]}>
                        <TypingDots />
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask about traffic laws..."
                  placeholderTextColor="#8892A4"
                  multiline
                  maxLength={500}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.sendButton, !canSend && styles.disabledButton]}
                  onPress={() => sendMessage(input)}
                  disabled={!canSend}
                >
                  <Ionicons name="send" size={20} color="#0A0E1A" />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#00D4FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#00D4FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 20
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0A0E1A",
    width: "100%",
    height: "100%"
  },
  keyboardView: {
    flex: 1,
    backgroundColor: "#0A0E1A"
  },
  sheet: {
    flex: 1,
    backgroundColor: "#0A0E1A",
    width: "100%",
    height: "100%",
    overflow: "hidden"
  },
  header: {
    backgroundColor: "#1E2438",
    paddingHorizontal: 14,
    paddingTop: 50,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  headerTextGroup: {
    marginLeft: 10,
    flex: 1
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700"
  },
  headerSubtitle: {
    color: "#8892A4",
    fontSize: 11,
    marginTop: 2
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  closeText: {
    color: "#8892A4",
    fontSize: 18,
    fontWeight: "700"
  },
  messages: {
    flex: 1
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 18
  },
  messageBlock: {
    marginBottom: 12,
    maxWidth: "100%"
  },
  userMessageBlock: {
    alignItems: "flex-end"
  },
  botMessageBlock: {
    alignItems: "flex-start"
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end"
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#00D4FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8
  },
  avatarText: {
    color: "#0A0E1A",
    fontSize: 10,
    fontWeight: "700"
  },
  bubble: {
    maxWidth: "80%",
    padding: 12
  },
  userBubble: {
    backgroundColor: "#00D4FF",
    borderRadius: 18,
    borderBottomRightRadius: 4,
    marginLeft: "auto"
  },
  botBubble: {
    backgroundColor: "#1E2438",
    borderRadius: 18,
    borderBottomLeftRadius: 4
  },
  userBubbleText: {
    color: "#0A0E1A",
    fontSize: 14,
    lineHeight: 20
  },
  botBubbleText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20
  },
  timestamp: {
    fontSize: 10,
    color: "#8892A4",
    marginTop: 4
  },
  userTimestamp: {
    alignSelf: "flex-end",
    marginRight: 4
  },
  botTimestamp: {
    alignSelf: "flex-start",
    marginLeft: 36
  },
  suggestionScroller: {
    marginLeft: 36,
    marginBottom: 4
  },
  suggestionChip: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#00D4FF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8
  },
  suggestionText: {
    color: "#00D4FF",
    fontSize: 12
  },
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00D4FF",
    marginHorizontal: 3
  },
  inputRow: {
    backgroundColor: "#1E2438",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A3550",
    flexDirection: "row",
    alignItems: "flex-end"
  },
  input: {
    flex: 1,
    maxHeight: 80,
    backgroundColor: "#0A0E1A",
    color: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00D4FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8
  },
  disabledButton: {
    opacity: 0.4
  }
});
