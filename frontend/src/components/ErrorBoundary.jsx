import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="admin-msg error">Đã xảy ra lỗi hiển thị. Vui lòng tải lại trang.</div>
      );
    }
    return this.props.children;
  }
}
