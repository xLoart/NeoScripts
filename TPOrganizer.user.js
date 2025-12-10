// ==UserScript==
// @name         TP Beautify
// @namespace    Loart
// @version      6.9420
// @description  Unfuck the trading post
// @author       Loart
// @match        https://www.neopets.com/island/tradingpost.phtml*
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
        const instantPrice = origCard.querySelector('.bg-\\[\\#FFEBC6\\]')?.querySelector('.text-museo-bold')?.textContent || '';
        const origBuyBtn = origCard.querySelector('.button-classic-default');
        const origOfferBtn = origCard.querySelector('.button-classic-primary');

        const box = document.createElement('div');
        box.className = 'w-full mb-4 tp-border-frame';
        box.style.backgroundColor = bg;
        box.style.padding = '12px';

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-10 gap-3 p-3';
        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex flex-col items-center';
            const rarityHTML = item.rarity ? `<p class="text-center text-museo text-[12px] !text-[#E86060] mt-[-2px]">${item.rarity}</p>` : '';
            div.innerHTML = `${item.imgHTML}<p class="text-center text-museo-bold text-[14px] mt-1">${item.name}</p>${rarityHTML}`;
            const img = div.querySelector('img');
            if (img) img.className = 'h-[64px] w-[64px]';
            grid.appendChild(div);
        });

        const itemBox = document.createElement('div');
        itemBox.className = 'rounded-[12px] bg-white';
        itemBox.appendChild(grid);

        const bottom = document.createElement('div');
        bottom.className = 'flex gap-3 items-start mt-2';

        const wish = document.createElement('div');
        wish.className = 'bg-white rounded-[12px] p-2 flex-grow';
        wish.innerHTML = ` <p class="text-black text-cafeteria text-[17px] font-bold">${lotNum} -
            <a class="!text-[#02301F] !no-underline text-cafeteria text-[15px]" href="${ownerUrl}">
                (owned by <span class="text-[#02301F] cursor-pointer">${owner}</span>)
            </a></p>
        <p class="text-[15px] font-bold">Wishlist:</p><p class="text-museo-bold text-[15px] break-words">${wishlist}</p>`;
        bottom.appendChild(wish);

        if (instantPrice) {
            const priceBox = document.createElement('div');
            priceBox.className = 'bg-white rounded-[12px] p-2';
            priceBox.innerHTML = `
                <div class="flex justify-between bg-[#FFEBC6] items-center p-[8px] rounded-[7px]">
                    <p class="text-[16px]">Instant Buy</p>
                    <div class="flex gap-1 items-center">
                        <img src="https://images.neopets.com/tradingpost/assets/images/np-icon.png" class="w-[24px] h-[24px]">
                        <p class="text-museo-bold text-[16px]">${instantPrice}</p>
                    </div>
                </div>`;

            if (origBuyBtn) {
                const buyBtn = document.createElement('button');
                buyBtn.className = 'button-classic-default tp-classic-button relative cursor-pointer px-4 py-2';
                buyBtn.style.height = '45px';
                buyBtn.innerHTML = '<p class="text-white text-cafeteria">Instant Buy</p>';
                buyBtn.onclick = e => { e.preventDefault(); origBuyBtn.click(); };
                priceBox.appendChild(buyBtn);
            }

            if (origOfferBtn) {
                const offerBtn = document.createElement('button');
                offerBtn.className = 'button-classic-primary tp-classic-button relative cursor-pointer px-4 py-2';
                offerBtn.style.height = '45px';
                offerBtn.innerHTML = '<p class="text-white text-cafeteria">Make an Offer</p>';
                offerBtn.onclick = e => { e.preventDefault(); origOfferBtn.click(); };
                priceBox.appendChild(offerBtn);
            }

            bottom.appendChild(priceBox);
        }

        box.appendChild(itemBox);
        box.appendChild(bottom);

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

    popupObserver.observe(document.body, { childList: true, subtree: true });

    function finalize(grid, data) {
        const container = document.createElement('div');
        container.className = 'flex flex-col pt-[32px] px-4';
        data.forEach(d => container.appendChild(buildLot(d.lot, d.items)));
        grid.parentNode.insertBefore(container, grid.nextSibling);
        return container;
    }

    let lastGrid = null;
    let busy = false;
    let currentContainer = null;

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
                setTimeout(check, 1000);
            } else {
                disableCSS();
            }
        }
    }).observe(document, { subtree: true, childList: true });

    const obs2 = new MutationObserver(check);
    const findContainer = () => {
        const el = document.querySelector('#app, #container__2020, .tp-main-content');
        if (el) {
            obs2.observe(el, { childList: true, subtree: true });
        } else {
            setTimeout(findContainer, 500);
        }
    };
    findContainer();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(check, 500));
    }
})();
