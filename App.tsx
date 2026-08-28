import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar, View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RootNavigator from './src/navigation/RootNavigator';
import { Colors } from './src/constants/colors';
import './src/i18n'; // Import i18n setup

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught application exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0B132B" />
          <Text style={styles.errorTitle}>Oops! Something went wrong.</Text>
          <Text style={styles.errorSubtitle}>
            We encountered an unexpected runtime error instead of rendering the screen:
          </Text>
          <ScrollView style={styles.errorScroll} contentContainerStyle={styles.errorScrollContent}>
            <Text style={styles.errorMessage}>{this.state.error?.message || 'Unknown Error'}</Text>
            {this.state.errorInfo && (
              <Text style={styles.errorStack}>{this.state.errorInfo.componentStack}</Text>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.retryButton} onPress={this.handleReset} activeOpacity={0.8}>
            <Text style={styles.retryText}>Reload / Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={Colors.background}
            translucent={false}
          />
          <GlobalErrorBoundary>
            <RootNavigator />
          </GlobalErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B132B',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F87171',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorScroll: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  errorScrollContent: {
    padding: 16,
  },
  errorMessage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 12,
  },
  errorStack: {
    fontSize: 12,
    color: '#CBD5E1',
    fontFamily: 'Courier',
    lineHeight: 16,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
