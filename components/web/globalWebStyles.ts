export const GLOBAL_WEB_CSS = `
html, body, #root {
  height: 100%;
  width: 100%;
}

body {
  margin: 0;
  overflow: hidden;
  background: #f5f7fa;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (max-width: 1023px) {
  body {
    overflow: auto;
  }
}

#root {
  display: flex;
  flex-direction: column;
}

input, textarea {
  outline: none;
}

@media (min-width: 1024px) {
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(93, 111, 135, 0.35);
    border-radius: 999px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }
}

#auth-form-scroll {
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #3057f2 rgba(48, 87, 242, 0.1);
}

#auth-form-scroll::-webkit-scrollbar {
  width: 8px;
}

#auth-form-scroll::-webkit-scrollbar-thumb {
  background: #3057f2;
  border-radius: 999px;
}

#auth-form-scroll::-webkit-scrollbar-track {
  background: rgba(48, 87, 242, 0.1);
}

@media (min-width: 1024px) {
  [data-testid="points-balance-card"]:hover,
  [data-testid="points-chart-card"]:hover,
  [data-testid="points-stat-card"]:hover,
  [data-testid="points-add-card"]:hover {
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    transform: translateY(-1px);
  }

  [data-testid="points-quick-chip"]:hover {
    border-color: #3057f2 !important;
    background: rgba(48, 87, 242, 0.08) !important;
  }

  [data-testid="points-add-btn"]:hover {
    filter: brightness(1.05);
  }

  [data-testid="records-row"]:hover {
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
  }

  [data-testid="medical-record-info-card"]:hover,
  [data-testid="medical-record-linked-row"]:hover,
  [data-testid="medical-record-image"]:hover {
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
  }

  [data-testid="medical-record-delete"]:hover,
  [data-testid="medical-record-delete-bottom"]:hover {
    background: #fee2e2 !important;
    border-color: #fca5a5 !important;
  }

  [data-testid="medical-record-back"]:hover {
    opacity: 0.85;
  }

  [data-testid="points-balance-card"],
  [data-testid="points-chart-card"],
  [data-testid="points-stat-card"],
  [data-testid="points-add-card"],
  [data-testid="points-quick-chip"],
  [data-testid="points-add-btn"],
  [data-testid="records-row"],
  [data-testid="medical-record-info-card"],
  [data-testid="medical-record-linked-row"],
  [data-testid="medical-record-image"],
  [data-testid="medical-record-delete"],
  [data-testid="medical-record-delete-bottom"],
  [data-testid="medical-record-back"] {
    transition: box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease,
      background-color 160ms ease, filter 160ms ease, opacity 160ms ease;
  }
}
`;
