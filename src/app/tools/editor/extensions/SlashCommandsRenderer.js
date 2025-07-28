export const renderSlashCommands = () => {
  let popup;
  let selectedIndex = 0;
  let filteredItems = [];

  const createPopup = () => {
    popup = document.createElement("div");
    popup.className = "slash-commands-popup";
    popup.style.cssText = `
      position: fixed;
      z-index: 9999;
      background: white;
      border: 1px solid #d9d9d9;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      width: 320px;
      max-height: 400px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const header = document.createElement("div");
    header.style.cssText = `
      padding: 8px 12px;
      border-bottom: 1px solid #f0f0f0;
      background: #fafafa;
      font-size: 11px;
      color: #8c8c8c;
      text-align: center;
    `;
    header.textContent = "↑↓ 选择 • Enter 确认 • ESC 取消";

    const list = document.createElement("div");
    list.className = "commands-list";
    list.style.cssText = `
      max-height: 320px;
      overflow-y: auto;
      padding: 4px 0;
    `;

    popup.appendChild(header);
    popup.appendChild(list);
    document.body.appendChild(popup);

    return list;
  };

  const renderItems = (items, listElement) => {
    filteredItems = items;
    selectedIndex = 0;
    listElement.innerHTML = "";

    if (items.length === 0) {
      const noResults = document.createElement("div");
      noResults.style.cssText = `
        padding: 24px;
        text-align: center;
        color: #8c8c8c;
        font-size: 14px;
      `;
      noResults.textContent = "未找到匹配的命令";
      listElement.appendChild(noResults);
      return;
    }

    items.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "command-item";
      itemElement.style.cssText = `
        padding: 10px 12px;
        margin: 2px 8px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid transparent;
        ${index === selectedIndex ? "background: #e6f7ff; border-color: #1890ff;" : "background: transparent;"}
      `;

      itemElement.innerHTML = `
        <div style="font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          ${item.icon}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 14px; font-weight: 600; color: #262626; margin-bottom: 2px;">${item.title}</div>
          <div style="font-size: 12px; color: #8c8c8c; line-height: 1.3;">${item.description}</div>
        </div>
      `;

      // 添加点击事件
      itemElement.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        executeCommand(item);
      });

      // 添加鼠标悬停事件
      itemElement.addEventListener("mouseenter", () => {
        updateSelection(index, listElement);
      });

      // 添加鼠标悬停样式
      itemElement.addEventListener("mouseover", () => {
        if (index !== selectedIndex) {
          itemElement.style.background = "#f5f5f5";
        }
      });

      itemElement.addEventListener("mouseout", () => {
        if (index !== selectedIndex) {
          itemElement.style.background = "transparent";
        }
      });

      listElement.appendChild(itemElement);
    });
  };

  const executeCommand = (item) => {
    if (window.slashCommandProps) {
      item.command(window.slashCommandProps);
      // 执行命令后关闭面板
      if (popup) {
        popup.remove();
        popup = null;
      }
    }
  };

  const updateSelection = (index, listElement) => {
    selectedIndex = index;
    const items = listElement.querySelectorAll(".command-item");
    items.forEach((item, i) => {
      if (i === selectedIndex) {
        item.style.background = "#e6f7ff";
        item.style.borderColor = "#1890ff";
      } else {
        item.style.background = "transparent";
        item.style.borderColor = "transparent";
      }
    });

    // 滚动到选中项
    const selectedItem = items[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  return {
    onStart: (props) => {
      if (!props.clientRect) {
        return;
      }

      // 保存props供点击事件使用
      window.slashCommandProps = props;

      const listElement = createPopup();
      renderItems(props.items || [], listElement);

      // 定位popup
      const rect = props.clientRect();
      if (rect) {
        // 确保面板不会超出视窗
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top = rect.bottom + 8;
        let left = rect.left;

        // 如果面板会超出底部，显示在上方
        if (top + 400 > viewportHeight) {
          top = rect.top - 408; // 400 + 8
        }

        // 如果面板会超出右侧，向左调整
        if (left + 320 > viewportWidth) {
          left = viewportWidth - 320 - 8;
        }

        popup.style.top = `${Math.max(8, top)}px`;
        popup.style.left = `${Math.max(8, left)}px`;
      }
    },

    onUpdate(props) {
      if (!props.clientRect || !popup) {
        return;
      }

      // 更新位置
      const rect = props.clientRect();
      if (rect) {
        popup.style.top = `${rect.bottom + 8}px`;
        popup.style.left = `${rect.left}px`;
      }

      // 重新渲染列表
      const listElement = popup.querySelector(".commands-list");
      if (listElement) {
        renderItems(props.items || [], listElement);
      }
    },

    onKeyDown(props) {
      if (!popup || filteredItems.length === 0) {
        return false;
      }

      if (props.event.key === "Escape") {
        return true;
      }

      if (props.event.key === "ArrowDown") {
        props.event.preventDefault();
        selectedIndex = (selectedIndex + 1) % filteredItems.length;
        const listElement = popup.querySelector(".commands-list");
        if (listElement) {
          updateSelection(selectedIndex, listElement);
        }
        return true;
      }

      if (props.event.key === "ArrowUp") {
        props.event.preventDefault();
        selectedIndex = (selectedIndex + filteredItems.length - 1) % filteredItems.length;
        const listElement = popup.querySelector(".commands-list");
        if (listElement) {
          updateSelection(selectedIndex, listElement);
        }
        return true;
      }

      if (props.event.key === "Enter") {
        props.event.preventDefault();
        const selectedItem = filteredItems[selectedIndex];
        if (selectedItem) {
          executeCommand(selectedItem);
        }
        return true;
      }

      return false;
    },

    onExit() {
      if (popup) {
        popup.remove();
      }
      popup = null;
      selectedIndex = 0;
      filteredItems = [];
      // 清理全局变量
      if (window.slashCommandProps) {
        delete window.slashCommandProps;
      }
    },
  };
};
