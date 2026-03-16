// ==UserScript==
// @name         개인사전 변환기 (Custom Dictionary Converter)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  입력창 및 일반 텍스트의 지정 단어를 완벽하게 일괄 변환하는 최적화 도구입니다.
// @author       You
// @match        https://crack.wrtn.ai/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
        #dict-setting-btn {
            position: fixed; bottom: 20px; right: 80px; z-index: 999998;
            background-color: #1890ff; color: white; border: none; border-radius: 50%;
            width: 48px; height: 48px; font-size: 24px; cursor: pointer;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: 0.3s; display: flex; align-items: center; justify-content: center;
        }
        #dict-setting-btn:hover { background-color: #096dd9; transform: scale(1.05); }

        #custom-dict-modal {
            position: fixed; bottom: 80px; right: 80px;
            width: 320px; max-height: 60vh; background: #F7F7F5; border: 1px solid #C7C5BD;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 999998; display: none;
            flex-direction: column; border-radius: 8px; font-family: sans-serif;
        }
        #custom-dict-header {
            padding: 12px 16px; border-bottom: 1px solid #E5E5E1; font-weight: bold; font-size: 15px; color: #1A1918;
            display: flex; justify-content: space-between; align-items: center;
        }
        #custom-dict-body {
            padding: 16px; overflow-y: auto; flex-grow: 1; min-height: 150px;
        }
        .dict-row {
            display: flex; gap: 6px; margin-bottom: 8px; align-items: center;
        }
        .dict-row input {
            flex: 1; padding: 6px; border: 1px solid #C7C5BD; border-radius: 4px; font-size: 13px; font-family: sans-serif;
            width: 100%; box-sizing: border-box;
        }
        .dict-remove-btn {
            background: #61605A; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;
        }
        .dict-remove-btn:hover { background: #42413D; }
        #custom-dict-footer {
            padding: 12px 16px; border-top: 1px solid #E5E5E1; display: flex; justify-content: space-between; gap: 8px;
        }
        .dict-btn {
            padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; color: white; font-weight: bold; font-size: 13px;
        }
        #dict-add-btn { background: #1890ff; flex: 1; }
        #dict-add-btn:hover { background: #096dd9; }
        #dict-save-btn { background: #52c41a; flex: 1; }
        #dict-save-btn:hover { background: #389e0d; }

        #custom-dict-popup {
            position: absolute; display: none; z-index: 999999;
            background: #1890ff; color: white; border: none; border-radius: 50%;
            width: 40px; height: 40px; text-align: center; line-height: 40px;
            cursor: pointer; box-shadow: 0 4px 8px rgba(0,0,0,0.2); font-size: 20px;
            transition: transform 0.1s;
        }
        #custom-dict-popup:hover { transform: scale(1.1); background: #096dd9; }
    `);

    let dictData = GM_getValue('userDict', [{original: '', target: ''}]);

    const settingBtn = document.createElement('button');
    settingBtn.id = 'dict-setting-btn';
    settingBtn.innerHTML = '📖';
    document.body.appendChild(settingBtn);

    const modal = document.createElement('div');
    modal.id = 'custom-dict-modal';
    modal.innerHTML = `
        <div id="custom-dict-header"><span>📖 개인사전 변환기 설정</span><span style="cursor:pointer;" id="dict-x-btn">❌</span></div>
        <div id="custom-dict-body"></div>
        <div id="custom-dict-footer">
            <button id="dict-add-btn" class="dict-btn">+ 추가</button>
            <button id="dict-save-btn" class="dict-btn">저장하기</button>
        </div>
    `;
    document.body.appendChild(modal);

    const body = document.getElementById('custom-dict-body');
    const addBtn = document.getElementById('dict-add-btn');
    const saveBtn = document.getElementById('dict-save-btn');

    const popup = document.createElement('div');
    popup.id = 'custom-dict-popup';
    popup.innerText = '📖';
    document.body.appendChild(popup);

    function renderList() {
        body.innerHTML = '';
        dictData.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'dict-row';

            const originInput = document.createElement('input');
            originInput.type = 'text';
            originInput.placeholder = '원본 단어';
            originInput.value = item.original;
            originInput.addEventListener('input', (e) => { dictData[index].original = e.target.value; });

            const targetInput = document.createElement('input');
            targetInput.type = 'text';
            targetInput.placeholder = '변경할 단어';
            targetInput.value = item.target;
            targetInput.addEventListener('input', (e) => { dictData[index].target = e.target.value; });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'dict-remove-btn';
            removeBtn.innerText = '삭제';
            removeBtn.onclick = () => {
                dictData.splice(index, 1);
                renderList();
            };

            row.appendChild(originInput);
            row.appendChild(targetInput);
            row.appendChild(removeBtn);
            body.appendChild(row);
        });
    }

    settingBtn.addEventListener('click', () => {
        if (modal.style.display === 'none' || modal.style.display === '') {
            dictData = GM_getValue('userDict', [{original: '', target: ''}]);
            renderList();
            modal.style.display = 'flex';
        } else {
            modal.style.display = 'none';
        }
    });

    document.getElementById('dict-x-btn').onclick = () => modal.style.display = 'none';

    saveBtn.onclick = () => {
        dictData = dictData.filter(item => item.original.trim() !== '');
        if (dictData.length === 0) dictData.push({original: '', target: ''});
        GM_setValue('userDict', dictData);
        saveBtn.innerText = '저장 완료!';
        setTimeout(() => { saveBtn.innerText = '저장하기'; modal.style.display = 'none'; }, 1000);
        renderList();
    };

    addBtn.onclick = () => {
        dictData.push({original: '', target: ''});
        renderList();
        setTimeout(() => { body.scrollTop = body.scrollHeight; }, 10);
    };

    document.addEventListener('mouseup', function(e) {
        if (modal.contains(e.target) || settingBtn.contains(e.target) || popup.contains(e.target)) return;

        setTimeout(() => {
            let hasSelection = false;
            const activeEl = document.activeElement;

            if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
                if (activeEl.selectionStart !== activeEl.selectionEnd) {
                    hasSelection = true;
                }
            } else {
                const sel = window.getSelection();
                if (sel.rangeCount > 0 && sel.toString().trim().length > 0) {
                    hasSelection = true;
                }
            }

            if (hasSelection) {
                popup.style.left = `${e.pageX - 20}px`;
                popup.style.top = `${e.pageY - 50}px`;
                popup.style.display = 'block';
            } else {
                popup.style.display = 'none';
            }
        }, 10);
    });

    document.addEventListener('mousedown', function(e) {
        if (!popup.contains(e.target) && !modal.contains(e.target) && !settingBtn.contains(e.target)) {
            popup.style.display = 'none';
        }
    });

    popup.addEventListener('mousedown', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const savedDict = GM_getValue('userDict', []);
        if (savedDict.length === 0) {
            popup.style.display = 'none';
            return;
        }

        const activeEl = document.activeElement;

        if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
            let start = activeEl.selectionStart;
            let end = activeEl.selectionEnd;

            if (start === end) {
                popup.style.display = 'none';
                return;
            }

            let text = activeEl.value;
            let before = text.substring(0, start);
            let targetText = text.substring(start, end);
            let after = text.substring(end);

            let originalTargetText = targetText;

            savedDict.forEach(item => {
                const orig = item.original.trim();
                if (orig !== '') {
                    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(escapeRegExp(orig), 'gi');
                    targetText = targetText.replace(regex, item.target);
                }
            });

            if (targetText !== originalTargetText) {
                let newValue = before + targetText + after;

                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
                nativeInputValueSetter.call(activeEl, newValue);

                const event = new Event('input', { bubbles: true });
                activeEl.dispatchEvent(event);

                activeEl.setSelectionRange(start, start + targetText.length);
            }

            popup.style.display = 'none';
            return;
        }

        const sel = window.getSelection();
        if (sel.rangeCount === 0 || sel.toString().trim().length === 0) {
            popup.style.display = 'none';
            return;
        }

        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const nodesToModify = [];

        if (container.nodeType === Node.TEXT_NODE) {
            nodesToModify.push(container);
        } else {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
            let n;
            while ((n = walker.nextNode())) {
                try {
                    if (range.comparePoint(n, 0) <= 0 && range.comparePoint(n, n.nodeValue.length) >= 0) {
                        nodesToModify.push(n);
                    }
                } catch (err) {
                    if (n === range.startContainer || n === range.endContainer) nodesToModify.push(n);
                }
            }
        }

        nodesToModify.forEach(node => {
            let text = node.nodeValue;
            if (!text) return;

            let start = (node === range.startContainer) ? range.startOffset : 0;
            let end = (node === range.endContainer) ? range.endOffset : text.length;

            if (start > end) { let temp = start; start = end; end = temp; }
            if (start === end) return;

            let before = text.substring(0, start);
            let targetText = text.substring(start, end);
            let after = text.substring(end);

            let originalTargetText = targetText;

            savedDict.forEach(item => {
                const orig = item.original.trim();
                if (orig !== '') {
                    const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(escapeRegExp(orig), 'gi');
                    targetText = targetText.replace(regex, item.target);
                }
            });

            if (targetText !== originalTargetText) {
                node.nodeValue = before + targetText + after;
            }
        });

        popup.style.display = 'none';
        sel.removeAllRanges();
    });

})();
