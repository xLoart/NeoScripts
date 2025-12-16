// ==UserScript==
// @name         TP Beautify
// @namespace    Loart
// @version      6.9420.4
// @description  Unfuck the trading post
// @author       Loart
// @match        https://www.neopets.com/island/tradingpost.phtml*
// @updateURL    https://github.com/xLoart/NeoScripts/raw/refs/heads/main/TPOrganizer.user.js
// @downloadURL  https://github.com/xLoart/NeoScripts/raw/refs/heads/main/TPOrganizer.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function isBrowsePage() {
        return location.hash.includes('type=browse');
    }

    const hideCSS = document.createElement('style');
    hideCSS.id = 'tp-beautify-css';
    hideCSS.textContent = `
        .grid.grid-cols-1.sm\\:grid-cols-2.xl\\:grid-cols-3 {
            display: none !important;
        }
        .grid.grid-cols-1.sm\\:grid-cols-2.xl\\:grid-cols-3 .tp-popup-overlay,
        .grid.grid-cols-1.sm\\:grid-cols-2.xl\\:grid-cols-3 .tp-popup-confirm-overlay {
            display: none !important;
        }
    `;

    function enableCSS() {
        if (!document.getElementById('tp-beautify-css')) {
            (document.head || document.documentElement).appendChild(hideCSS);
        }
    }

    function disableCSS() {
        const css = document.getElementById('tp-beautify-css');
        if (css) {
            css.remove();
        }
    }

    if (isBrowsePage()) {
        enableCSS();
    }

    function getItemsFromPopup(popup) {
        const items = [];
        popup.querySelectorAll('.grid.grid-cols-3 > .flex.flex-col.items-center').forEach(el => {
            const img = el.querySelector('.relative');
            const name = el.querySelector('p');
            if (img && name) {
                const rarityEl = name.nextElementSibling;
                const rarity = rarityEl?.textContent.trim() || '';
                items.push({
                    imgHTML: img.outerHTML,
                    name: name.textContent.trim(),
                    rarity: rarity
                });
            }
        });
        return items;
    }

    function getVisibleItems(card) {
        const items = [];
        card.querySelectorAll('.rounded-\\[12px\\].bg-white > .flex.gap-4.px-3.py-1').forEach(el => {
            const img = el.querySelector('.relative');
            const nameContainer = el.querySelector('.flex.flex-col');
            const name = nameContainer?.querySelector('.text-museo-bold');
            if (img && name) {
                const rarityEl = nameContainer.querySelector('.text-museo:not(.text-museo-bold)');
                const rarity = rarityEl?.textContent.trim() || '';
                items.push({
                    imgHTML: img.outerHTML,
                    name: name.textContent.trim(),
                    rarity: rarity
                });
            }
        });
        return items;
    }

    function buildLot(origCard, items) {
        const lotNum = origCard.querySelector('.text-cafeteria')?.textContent || 'Unknown';
        const ownerLink = origCard.querySelector('a[href*="userlookup"]');
        const owner = ownerLink?.textContent.match(/\(owned by (.*?)\)/)?.[1] || 'Unknown';
        const ownerUrl = ownerLink?.href || '#';
        const bg = window.getComputedStyle(origCard).backgroundColor;
        const wishlist = origCard.querySelector('.wishlist-text')?.textContent || 'none';
        const instantPrice = origCard.querySelector('.bg-\\[\\#CBCCEA\\]')?.querySelector('.text-museo-bold')?.textContent || '';
        const origBuyBtn = origCard.querySelector('.button-classic-default');
        const origOfferBtn = origCard.querySelector('.button-classic-primary');

        const box = document.createElement('div');
        box.className = 'w-full mb-1 tp-border-frame flex items-center gap-2';
        box.style.backgroundColor = bg;
        box.style.padding = '6px';

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'flex flex-wrap gap-2 min-w-0 flex-grow content-start';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex-shrink-0 text-center';
            div.style.width = '65px';
            const rarityHTML = item.rarity ? `<p class="text-museo text-[10px] !text-[#E86060] break-words">${item.rarity}</p>` : '';
            div.innerHTML = `${item.imgHTML}<p class="text-museo-bold text-[11px] break-words mt-0.5">${item.name}</p>${rarityHTML}`;
            const img = div.querySelector('img');
            if (img) {
                img.className = 'h-[40px] w-[40px] mx-auto';
                const relativeContainer = img.closest('.relative');
                if (relativeContainer) {
                    relativeContainer.style.width = '40px';
                    relativeContainer.style.height = '40px';
                    relativeContainer.style.margin = '0 auto';
                    const quantityBadge = relativeContainer.querySelector('.item-count, div[class*="item-count"]');
                    if (quantityBadge) {
                        quantityBadge.style.right = '0';
                        quantityBadge.style.bottom = '0';
                    }
                }
            }
            itemsContainer.appendChild(div);
        });

        const infoSection = document.createElement('div');
        infoSection.className = 'flex-shrink-0 bg-white rounded-[8px] p-1.5';
        infoSection.style.width = '200px';
        infoSection.innerHTML = `
            <p class="text-black text-[14px] font-bold">${lotNum} - <a class="!text-[#02301F] !no-underline text-[13px]" href="${ownerUrl}">${owner}</a></p>
            <p class="text-[13px]"><span class="font-bold">Wishlist:</span> <span class="text-museo-bold">${wishlist}</span></p>
        `;

        const buttonsSection = document.createElement('div');
        buttonsSection.className = 'flex flex-col gap-1 flex-shrink-0';

        if (instantPrice) {
            const priceLabel = document.createElement('p');
            priceLabel.className = 'text-[12px] text-center bg-[#CBCCEA] px-2 py-0.5 rounded';
            priceLabel.innerHTML = `<span class="font-bold">${instantPrice}</span>`;
            buttonsSection.appendChild(priceLabel);
        }

        if (origBuyBtn) {
            const buyBtn = document.createElement('button');
            buyBtn.className = 'button-classic-default tp-classic-button cursor-pointer px-2 py-1';
            buyBtn.style.height = '28px';
            buyBtn.style.minWidth = '100px';
            buyBtn.innerHTML = '<p class="text-white text-[13px]">Instant Buy</p>';
            buyBtn.onclick = e => { e.preventDefault(); origBuyBtn.click(); };
            buttonsSection.appendChild(buyBtn);
        }

        if (origOfferBtn) {
            const offerBtn = document.createElement('button');
            offerBtn.className = 'button-classic-primary tp-classic-button cursor-pointer px-2 py-1';
            offerBtn.style.height = '28px';
            offerBtn.style.minWidth = '100px';
            offerBtn.innerHTML = '<p class="text-white text-[13px]">Make Offer</p>';
            offerBtn.onclick = e => { e.preventDefault(); origOfferBtn.click(); };
            buttonsSection.appendChild(offerBtn);
        }

        box.appendChild(itemsContainer);
        box.appendChild(infoSection);
        box.appendChild(buttonsSection);

        return box;
    }

    function rebuild() {
        const grid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.xl\\:grid-cols-3');
        if (!grid) return;

        const lots = Array.from(grid.querySelectorAll('.tp-border-frame'));
        const data = [];
        const lotsWithMore = [];

        lots.forEach((lot, i) => {
            const visibleItems = getVisibleItems(lot);
            const hasMore = lot.querySelector('p.text-center.\\!text-\\[\\#A1A1A1\\]')?.textContent.includes('and more');

            if (visibleItems.length > 0) {
                data.push({ lot, items: visibleItems, i });
                if (hasMore) {
                    lotsWithMore.push({ lot, i });
                }
            }
        });

        data.sort((a, b) => a.i - b.i);
        currentContainer = finalize(grid, data);

        if (lotsWithMore.length > 0) {
            lotsWithMore.forEach((lotData, idx) => {
                setTimeout(() => {
                    const detailsBtn = lotData.lot.querySelector('p.text-cafeteria.text-\\[\\#E18C1D\\].cursor-pointer');
                    if (!detailsBtn) return;

                    autoLoadingItems = true;
                    detailsBtn.click();
                    setTimeout(() => {
                        const popup = document.querySelector('.tp-popup-overlay');
                        if (!popup) {
                            autoLoadingItems = false;
                            return;
                        }

                        const allItems = getItemsFromPopup(popup);
                        const closeBtn = popup.querySelector('img[src*="close-icon"]');
                        if (closeBtn) closeBtn.click();

                        setTimeout(() => {
                            if (allItems.length > 0 && currentContainer) {
                                const visualLot = currentContainer.children[lotData.i];
                                if (visualLot) {
                                    const newLot = buildLot(lotData.lot, allItems);
                                    currentContainer.replaceChild(newLot, visualLot);
                                }
                            }
                            autoLoadingItems = false;
                        }, 100);
                    }, 150);
                }, idx * 300);
            });
        }
    }

    let autoLoadingItems = false;

    const popupObserver = new MutationObserver(mutations => {
        mutations.forEach(mut => {
            mut.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    const popup = node.classList?.contains('tp-popup-confirm-overlay') || node.classList?.contains('tp-popup-overlay')
                        ? node
                        : node.querySelector('.tp-popup-confirm-overlay, .tp-popup-overlay');

                    if (popup && !autoLoadingItems) {
                        popup.dataset.visible = 'true';
                        popup.style.position = 'fixed';
                        popup.style.left = '50%';
                        popup.style.top = '50%';
                        popup.style.transform = 'translate(-50%, -50%)';
                        popup.style.zIndex = '10000';

                        if (popup.parentNode !== document.body) {
                            document.body.appendChild(popup);
                        }

                        const popupTitle = popup.querySelector('p.text-\\[\\#432005\\].text-cafeteria');
                        if (popupTitle && popupTitle.textContent.includes('Lot Purchased!')) {
                            setTimeout(() => {
                                const thanksButton = Array.from(popup.querySelectorAll('button')).find(btn =>
                                    btn.textContent.includes('Thanks!')
                                );

                                if (thanksButton) {
                                    const newButton = thanksButton.cloneNode(true);
                                    thanksButton.parentNode.replaceChild(newButton, thanksButton);

                                    newButton.onclick = (e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        popup.remove();
                                    };
                                }
                            }, 100);
                        }
                    }
                }
            });
        });
    });

    function startPopupObserver() {
        if (document.body) {
            popupObserver.observe(document.body, { childList: true, subtree: true });
        } else {
            setTimeout(startPopupObserver, 100);
        }
    }
    startPopupObserver();

    function finalize(grid, data) {
        const container = document.createElement('div');
        container.className = 'flex flex-col pt-[16px] px-2';

        const paginationBottom = document.querySelector('.p-4.flex.justify-center.mt-4');
        if (paginationBottom) {
            const paginationTop = paginationBottom.cloneNode(true);
            paginationTop.classList.remove('mt-4');
            paginationTop.classList.add('mb-4');

            const clonedButtons = paginationTop.querySelectorAll('button');
            const originalButtons = paginationBottom.querySelectorAll('button');
            clonedButtons.forEach((clonedBtn, index) => {
                if (originalButtons[index]) {
                    clonedBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        originalButtons[index].click();
                    });
                }
            });

            container.appendChild(paginationTop);
        }

        data.forEach(d => container.appendChild(buildLot(d.lot, d.items)));
        grid.parentNode.insertBefore(container, grid.nextSibling);
        return container;
    }

    let lastGrid = null;
    let busy = false;
    let currentContainer = null;

    function setDefaultFilter() {
        const selects = document.querySelectorAll('select');
        selects.forEach(select => {
            const option = Array.from(select.options).find(opt => opt.textContent.includes('Containing my phrase'));
            if (option && select.value !== option.value) {
                select.value = option.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                select.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    }

    function check() {
        if (!isBrowsePage()) return;
        if (busy) return;
        const grid = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.xl\\:grid-cols-3');
        if (grid && grid !== lastGrid && grid.querySelectorAll('.tp-border-frame').length > 0) {
            busy = true;
            lastGrid = grid;
            if (currentContainer) {
                currentContainer.remove();
                currentContainer = null;
            }
            setTimeout(() => { rebuild(); busy = false; }, 500);
        }
        setDefaultFilter();
    }

    check();

    let url = location.href;
    new MutationObserver(() => {
        if (location.href !== url) {
            url = location.href;
            lastGrid = null;
            if (currentContainer) {
                currentContainer.remove();
                currentContainer = null;
            }
            if (isBrowsePage()) {
                enableCSS();
                setTimeout(() => {
                    check();
                    setDefaultFilter();
                }, 1000);
            } else {
                disableCSS();
            }
        }
    }).observe(document, { subtree: true, childList: true });

    const obs2 = new MutationObserver(check);
    const findContainer = () => {
        const el = document.querySelector('#app, #container__2020, .tp-main-content');
        if (el && el.isConnected) {
            try {
                obs2.observe(el, { childList: true, subtree: true });
            } catch (e) {
                setTimeout(findContainer, 500);
            }
        } else {
            setTimeout(findContainer, 500);
        }
    };
    findContainer();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(check, 500));
    }
})();
