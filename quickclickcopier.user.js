// ==UserScript==
// @name         딸깍 복사기📎
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  지정된 텍스트와 프리셋을 함께 복사하는 스크립트
// @author       Anonymous
// @match        *://crack.wrtn.ai/*
// @require      https://unpkg.com/turndown/lib/turndown.browser.umd.js
// @require      https://unpkg.com/turndown-plugin-gfm/dist/turndown-plugin-gfm.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // 1. 외부 라이브러리(Turndown) 초기화
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
        strongDelimiter: '**',
        bulletListMarker: '-'
    });
    turndownService.use(turndownPluginGfm.gfm);

    // 줄바꿈 태그 변환
    turndownService.addRule('br', {
        filter: 'br',
        replacement: function () {
            return '\n';
        }
    });

    // P 태그 변환 시 단일 줄바꿈 적용
    turndownService.addRule('paragraph', {
        filter: 'p',
        replacement: function (content) {
            return content + '\n';
        }
    });

    // 인용구 변환 시 공백 제거
    turndownService.addRule('blockquote', {
        filter: 'blockquote',
        replacement: function (content) {
            content = content.replace(/^\n+|\n+$/g, '');
            content = content.replace(/^/gm, '>');
            return content + '\n';
        }
    });

    // 2. CSS 스타일 주입
    GM_addStyle(`
        #preset-modal-overlay {
            --modal-bg: #ffffff;
            --modal-text: #333333;
            --input-bg: #f9f9f9;
            --input-border: #cccccc;
            --item-bg: #f1f1f1;
            --item-text-sub: #666666;
            --list-border: #eeeeee;
            --btn-close-bg: #e0e0e0;
            --btn-close-text: #333333;
            --btn-close-hover: #cccccc;

            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            padding: 15px;
            box-sizing: border-box;
        }

        @media (prefers-color-scheme: dark) {
            #preset-modal-overlay {
                --modal-bg: #1e1e1e;
                --modal-text: #ffffff;
                --input-bg: #2a2a2a;
                --input-border: #444444;
                --item-bg: #2a2a2a;
                --item-text-sub: #aaaaaa;
                --list-border: #444444;
                --btn-close-bg: #555555;
                --btn-close-text: #ffffff;
                --btn-close-hover: #666666;
            }
        }

        #preset-modal-content {
            background: var(--modal-bg);
            color: var(--modal-text);
            width: 100%;
            max-width: 400px;
            max-height: 90vh;
            overflow-y: auto;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            font-family: sans-serif;
            transition: background 0.3s, color 0.3s;
            box-sizing: border-box;
        }
        #preset-modal-content h2 {
            margin-top: 0;
            font-size: 18px;
            margin-bottom: 15px;
        }
        .preset-input-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-bottom: 20px;
        }
        .preset-input-group input, .preset-input-group textarea {
            width: 100%;
            background: var(--input-bg);
            border: 1px solid var(--input-border);
            color: var(--modal-text);
            padding: 10px;
            border-radius: 6px;
            box-sizing: border-box;
            font-size: 16px;
            transition: background 0.3s, border 0.3s, color 0.3s;
        }
        .preset-input-group textarea {
            resize: vertical;
            min-height: 70px;
        }
        .preset-btn-add {
            background: #4caf50;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
        }
        .preset-btn-add:hover { background: #45a049; }

        #preset-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 40vh;
            overflow-y: auto;
            border-top: 1px solid var(--list-border);
            padding-top: 15px;
            margin-bottom: 15px;
        }
        .preset-item {
            display: flex;
            align-items: flex-start;
            background: var(--item-bg);
            padding: 10px;
            border-radius: 6px;
            gap: 10px;
            transition: background 0.3s;
        }
        .preset-item input[type="radio"] {
            margin-top: 4px;
            cursor: pointer;
            flex-shrink: 0;
            width: 18px;
            height: 18px;
        }
        .preset-item-info {
            flex-grow: 1;
            overflow: hidden;
        }
        .preset-item-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 4px;
            word-break: keep-all;
        }
        .preset-item-content {
            font-size: 12px;
            color: var(--item-text-sub);
            white-space: pre-wrap;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .preset-btn-delete {
            background: #f44336;
            color: white;
            border: none;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            flex-shrink: 0;
        }
        .preset-btn-delete:hover { background: #da190b; }
        .preset-btn-close {
            width: 100%;
            background: var(--btn-close-bg);
            color: var(--btn-close-text);
            border: none;
            padding: 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s, color 0.3s;
        }
        .preset-btn-close:hover { background: var(--btn-close-hover); }

        .wrtn-preset-group {
            display: inline-flex;
            align-items: center;
            border: 1px solid #a0a0a0 !important;
            border-radius: 9999px;
            height: 32px;
            background: rgba(255, 255, 255, 0.4);
            margin-right: 8px !important;
            overflow: hidden;
            flex-shrink: 0;
            z-index: 10;
        }
        .wrtn-preset-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 36px;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 15px;
            color: #444;
            transition: background 0.2s;
        }
        .wrtn-preset-btn:hover {
            background: rgba(0, 0, 0, 0.08);
        }
        .wrtn-preset-divider {
            width: 1px;
            height: 18px;
            background: #a0a0a0 !important;
        }

        @media (prefers-color-scheme: dark) {
            .wrtn-preset-group {
                border-color: #555 !important;
                background: rgba(0, 0, 0, 0.2);
            }
            .wrtn-preset-btn { color: #ddd; }
            .wrtn-preset-btn:hover { background: rgba(255, 255, 255, 0.1); }
            .wrtn-preset-divider { background: #555 !important; }
        }
    `);

    // 3. 템퍼몽키 스토리지에서 데이터 불러오기
    let presets = GM_getValue('wrtnPresets', []);

    function savePresets() {
        GM_setValue('wrtnPresets', presets);
    }

    // 4. 모달창 UI 생성
    function createModal() {
        if (document.getElementById('preset-modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'preset-modal-overlay';

        overlay.innerHTML = `
            <div id="preset-modal-content">
                <h2>설정 관리</h2>
                <div class="preset-input-group">
                    <input type="text" id="new-preset-title" placeholder="설정 제목 (예: 현대물)" />
                    <textarea id="new-preset-content" placeholder="내용을 입력해 주십시오."></textarea>
                    <button class="preset-btn-add" id="btn-add-preset">추가하기</button>
                </div>
                <div id="preset-list"></div>
                <button class="preset-btn-close" id="btn-close-modal">닫기</button>
            </div>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-close-modal').addEventListener('click', () => {
            overlay.style.display = 'none';
        });

        document.getElementById('btn-add-preset').addEventListener('click', () => {
            const titleInput = document.getElementById('new-preset-title');
            const contentInput = document.getElementById('new-preset-content');

            if (!titleInput.value.trim() || !contentInput.value.trim()) {
                alert("제목과 내용을 모두 입력해 주십시오.");
                return;
            }

            presets.push({
                id: Date.now(),
                title: titleInput.value.trim(),
                content: contentInput.value.trim(),
                isActive: presets.length === 0
            });

            titleInput.value = '';
            contentInput.value = '';
            savePresets();
            renderPresetList();
        });
    }

    // 5. 목록 렌더링
    function renderPresetList() {
        const listContainer = document.getElementById('preset-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        presets.forEach((preset) => {
            const item = document.createElement('div');
            item.className = 'preset-item';

            item.innerHTML = `
                <input type="radio" name="activePreset" value="${preset.id}" ${preset.isActive ? 'checked' : ''} />
                <div class="preset-item-info">
                    <div class="preset-item-title">${preset.title}</div>
                    <div class="preset-item-content">${preset.content}</div>
                </div>
                <button class="preset-btn-delete" data-id="${preset.id}">삭제</button>
            `;

            const radioBtn = item.querySelector('input[type="radio"]');
            radioBtn.addEventListener('change', () => {
                presets.forEach(p => p.isActive = (p.id === preset.id));
                savePresets();
            });

            const deleteBtn = item.querySelector('.preset-btn-delete');
            deleteBtn.addEventListener('click', () => {
                presets = presets.filter(p => p.id !== preset.id);
                savePresets();
                renderPresetList();
            });

            listContainer.appendChild(item);
        });
    }

    // 6. 텍스트 복사 로직
    async function handleCopy(event) {
        const button = event.currentTarget;

        let container = button.closest('.flex.flex-col.gap-2.w-full') || button.closest('.flex.flex-col');
        let contentDiv = null;

        if (container) {
            contentDiv = container.querySelector('.wrtn-markdown');
        }

        if (!contentDiv) {
            alert("복사할 영역을 찾을 수 없습니다.");
            return;
        }

        const clone = contentDiv.cloneNode(true);

        const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, null, false);
        const textNodes = [];
        let node;
        while ((node = walker.nextNode())) {
            textNodes.push(node);
        }

        textNodes.forEach(n => {
            if (n.nodeValue.includes('\n')) {
                const fragment = document.createDocumentFragment();
                const parts = n.nodeValue.split('\n');
                parts.forEach((part, i) => {
                    fragment.appendChild(document.createTextNode(part));
                    if (i < parts.length - 1) {
                        fragment.appendChild(document.createElement('br'));
                    }
                });
                n.parentNode.replaceChild(fragment, n);
            }
        });

        let articleText = turndownService.turndown(clone.innerHTML);
        articleText = articleText.trim();

        const activePreset = presets.find(p => p.isActive);

        if (!activePreset) {
            alert("활성화된 항목이 없습니다. 설정을 추가하고 선택해 주십시오.");
            return;
        }

        // 특정 문장 제거 및 익명화된 구분선 적용
        const finalString = `${activePreset.content}\n\n---- 본문 내용 ----\n\n${articleText}`;

        try {
            await navigator.clipboard.writeText(finalString);

            const originalHTML = button.innerHTML;
            button.innerHTML = '✅';
            setTimeout(() => { button.innerHTML = originalHTML; }, 1500);
        } catch (err) {
            alert("클립보드 복사에 실패했습니다.");
        }
    }

    // 7. 버튼 삽입 로직
    function injectButtons() {
        const messageBlocks = document.querySelectorAll('.wrtn-markdown');

        messageBlocks.forEach(markdownDiv => {
            const container = markdownDiv.parentElement;
            if (!container) return;

            const toolbar = container.querySelector('.flex.items-center.justify-between.mt-2');
            if (!toolbar) return;

            if (toolbar.classList.contains('preset-injected')) return;

            const btnGroup = document.createElement('div');
            btnGroup.className = 'wrtn-preset-group';

            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'wrtn-preset-btn';
            settingsBtn.innerHTML = '⚙️';
            settingsBtn.title = "설정 열기";
            settingsBtn.addEventListener('click', () => {
                createModal();
                renderPresetList();
                document.getElementById('preset-modal-overlay').style.display = 'flex';
            });

            const divider = document.createElement('div');
            divider.className = 'wrtn-preset-divider';

            const copyBtn = document.createElement('button');
            copyBtn.className = 'wrtn-preset-btn';
            copyBtn.innerHTML = '📋';
            copyBtn.title = "함께 복사하기";
            copyBtn.addEventListener('click', handleCopy);

            btnGroup.appendChild(settingsBtn);
            btnGroup.appendChild(divider);
            btnGroup.appendChild(copyBtn);

            const leftGroup = toolbar.querySelector('.flex-row.gap-2.items-center, .space-x-2');
            if (leftGroup) {
                leftGroup.prepend(btnGroup);
            } else {
                toolbar.prepend(btnGroup);
            }

            toolbar.classList.add('preset-injected');
        });
    }

    // 초기 실행
    createModal();

    let observerTimeout = null;
    const observer = new MutationObserver(() => {
        if (observerTimeout) clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            injectButtons();
        }, 300);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
