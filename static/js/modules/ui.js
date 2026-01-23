/**
 * User Interface Utilities.
 * Handles Toasts, Modals, Theme toggling, and Loading overlays.
 */
export const UI = {
    Toast: {
        /**
         * Shows a toast notification.
         * @param {string} message - The message to display.
         * @param {string} [type='info'] - 'info', 'success', 'error', or 'warning'.
         * @param {number} [duration=3000] - Duration in ms.
         */
        show(message, type = 'info', duration = 3000) {
            let container = document.getElementById('toast-container');
            if (!container) {
                // Defensive creation if missing
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
                document.body.appendChild(container);
            }

            const toast = document.createElement('div');
            // Tailwind classes for Toast
            const baseClasses = "flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800 toast-enter border-l-4 pointer-events-auto";

            let typeClasses = "border-blue-500";
            let icon = '<i class="fa-solid fa-info-circle text-blue-500 text-lg"></i>';

            if (type === 'success') {
                typeClasses = "border-green-500";
                icon = '<i class="fa-solid fa-check-circle text-green-500 text-lg"></i>';
            } else if (type === 'error') {
                typeClasses = "border-red-500";
                icon = '<i class="fa-solid fa-exclamation-circle text-red-500 text-lg"></i>';
            } else if (type === 'warning') {
                typeClasses = "border-yellow-500";
                icon = '<i class="fa-solid fa-exclamation-triangle text-yellow-500 text-lg"></i>';
            }

            toast.className = `${baseClasses} ${typeClasses}`;

            // Create elements safely to prevent XSS in message
            const iconDiv = document.createElement('div');
            iconDiv.className = "inline-flex items-center justify-center flex-shrink-0 w-8 h-8";
            iconDiv.innerHTML = icon; // icon is internal constant, safe

            const msgDiv = document.createElement('div');
            msgDiv.className = "ml-3 text-sm font-normal";
            msgDiv.textContent = message; // Safe injection

            const closeBtn = document.createElement('button');
            closeBtn.type = "button";
            closeBtn.className = "ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700";
            closeBtn.setAttribute("aria-label", "Close");
            closeBtn.innerHTML = '<span class="sr-only">Close</span><i class="fa-solid fa-times"></i>';

            toast.appendChild(iconDiv);
            toast.appendChild(msgDiv);
            toast.appendChild(closeBtn);

            // Close button logic
            closeBtn.onclick = () => {
                toast.classList.remove('toast-enter');
                toast.classList.add('toast-exit');
                setTimeout(() => toast.remove(), 300);
            };

            container.appendChild(toast);

            // Auto remove
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.classList.remove('toast-enter');
                    toast.classList.add('toast-exit');
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        }
    },

    Modal: {
        _previousActiveElement: null,
        _handleKeyDown: null,

        /**
         * Traps focus within the modal for accessibility.
         * @param {HTMLElement} modal - The modal element.
         */
        trapFocus(modal) {
             this._previousActiveElement = document.activeElement;

             const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
             const firstElement = focusableElements[0];
             const lastElement = focusableElements[focusableElements.length - 1];

             this._handleKeyDown = (e) => {
                 if (e.key === 'Tab') {
                     if (e.shiftKey) {
                         if (document.activeElement === firstElement) {
                             e.preventDefault();
                             if(lastElement) lastElement.focus();
                         }
                     } else {
                         if (document.activeElement === lastElement) {
                             e.preventDefault();
                             if(firstElement) firstElement.focus();
                         }
                     }
                 } else if (e.key === 'Escape') {
                     // Check if it is the custom modal (handled internally here)
                     if (modal.id === 'custom-modal') {
                         const cancelBtn = modal.querySelector('#modal-cancel');
                         if (cancelBtn && !cancelBtn.classList.contains('hidden')) cancelBtn.click();
                         else {
                             const confirmBtn = modal.querySelector('#modal-confirm');
                             if(confirmBtn) confirmBtn.click();
                         }
                     }
                 }
             };

             modal.addEventListener('keydown', this._handleKeyDown);
             if (firstElement) firstElement.focus();
        },

        /**
         * Releases focus trap and restores focus to previous element.
         * @param {HTMLElement} modal - The modal element.
         */
        releaseFocus(modal) {
             if (this._handleKeyDown) {
                 modal.removeEventListener('keydown', this._handleKeyDown);
                 this._handleKeyDown = null;
             }
             if (this._previousActiveElement) {
                 this._previousActiveElement.focus();
                 this._previousActiveElement = null;
             }
        },

        /**
         * Shows a confirmation modal.
         * @param {string} message - The question.
         * @param {Function} onConfirm - Callback if confirmed.
         * @param {string} [title="Confirmação"] - Title of the modal.
         */
        confirm(message, onConfirm, title = "Confirmação") {
            const modal = document.getElementById('custom-modal');

            if (!modal) {
                if(window.confirm(message)) onConfirm();
                return;
            }

            const titleEl = document.getElementById('modal-title');
            const msgEl = document.getElementById('modal-message');
            const btnConfirm = document.getElementById('modal-confirm');
            const btnCancel = document.getElementById('modal-cancel');

            if(titleEl) titleEl.innerText = title;
            if(msgEl) msgEl.innerText = message;

            // Clean old listeners
            const newConfirm = btnConfirm.cloneNode(true);
            const newCancel = btnCancel.cloneNode(true);
            btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
            btnCancel.parentNode.replaceChild(newCancel, btnCancel);

            newConfirm.onclick = () => {
                modal.classList.add('hidden');
                this.releaseFocus(modal);
                onConfirm();
            };
            newCancel.onclick = () => {
                modal.classList.add('hidden');
                this.releaseFocus(modal);
            };

            modal.classList.remove('hidden');
            this.trapFocus(modal);
        },

        /**
         * Shows an alert modal.
         * @param {string} message - Message to display.
         * @param {string} [title="Aviso"] - Title of the modal.
         */
        alert(message, title = "Aviso") {
             const modal = document.getElementById('custom-modal');

             if (!modal) {
                 window.alert(message);
                 return;
             }

             const titleEl = document.getElementById('modal-title');
             const msgEl = document.getElementById('modal-message');
             const btnConfirm = document.getElementById('modal-confirm');
             const btnCancel = document.getElementById('modal-cancel');

             if(titleEl) titleEl.innerText = title;
             if(msgEl) msgEl.innerText = message;

             // Hide cancel button for alert
             if(btnCancel) btnCancel.classList.add('hidden');

             // Clean listeners
             const newConfirm = btnConfirm.cloneNode(true);
             btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);

             newConfirm.innerText = "OK";
             newConfirm.onclick = () => {
                 modal.classList.add('hidden');
                 this.releaseFocus(modal);
                 if(btnCancel) btnCancel.classList.remove('hidden'); // Restore for next use
                 newConfirm.innerText = "Confirmar"; // Restore
             };

             modal.classList.remove('hidden');
             this.trapFocus(modal);
        },

        /**
         * Prompts the user for input.
         * @param {string} message
         * @param {string} [defaultValue=""]
         * @returns {string|null} The user input or null.
         */
        prompt(message, defaultValue = "") {
            return window.prompt(message, defaultValue);
        }
    },

    Theme: {
        /**
         * Toggles between Light and Dark mode.
         */
        toggle() {
            const isDark = document.documentElement.classList.contains('dark');
            const icon = document.getElementById('theme-icon');

            if (isDark) {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                localStorage.theme = 'light';
                if(icon) {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            } else {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
                localStorage.theme = 'dark';
                if(icon) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                }
            }
        },

        /**
         * Initializes the theme based on local storage or system preference.
         */
        init() {
             if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
                const icon = document.getElementById('theme-icon');
                if(icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
            } else {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
            }
        }
    },

    Loading: {
        /**
         * Shows the loading overlay.
         */
        show() {
            const el = document.getElementById('loading-overlay');
            if(el) el.classList.remove('hidden');
        },
        /**
         * Hides the loading overlay.
         */
        hide() {
            const el = document.getElementById('loading-overlay');
            if(el) el.classList.add('hidden');
        }
    },

    Sidebar: {
        /**
         * Initializes sidebar interactions.
         */
        init() {
            const btn = document.getElementById('btn-mobile-menu');
            const overlay = document.getElementById('sidebar-overlay');
            const links = document.querySelectorAll('.nav-link');

            if (btn) {
                btn.addEventListener('click', () => {
                    this.toggle();
                });
            }

            if (overlay) {
                overlay.addEventListener('click', () => {
                    this.close();
                });
            }

            // Close sidebar on mobile when link clicked
            links.forEach(link => {
                link.addEventListener('click', () => {
                   if (window.innerWidth < 768) { // md breakpoint
                       this.close();
                   }
                });
            });
        },
        /**
         * Toggles sidebar visibility.
         */
        toggle() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const btn = document.getElementById('btn-mobile-menu');

            if (sidebar) {
                 const isClosed = sidebar.classList.contains('-translate-x-full');
                 if (isClosed) {
                     sidebar.classList.remove('-translate-x-full');
                     if(overlay) overlay.classList.remove('hidden');
                     if(btn) btn.setAttribute('aria-expanded', 'true');
                 } else {
                     sidebar.classList.add('-translate-x-full');
                     if(overlay) overlay.classList.add('hidden');
                     if(btn) btn.setAttribute('aria-expanded', 'false');
                 }
            }
        },
        /**
         * Closes the sidebar.
         */
        close() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.getElementById('sidebar-overlay');
            const btn = document.getElementById('btn-mobile-menu');

            if (sidebar) {
                sidebar.classList.add('-translate-x-full');
            }
            if (overlay) {
                overlay.classList.add('hidden');
            }
            if (btn) {
                btn.setAttribute('aria-expanded', 'false');
            }
        },
        /**
         * Sets the active navigation link based on the current hash.
         * @param {string} hash - The current URL hash.
         */
        setActive(hash) {
            const links = document.querySelectorAll('.nav-link');
            // Default to dashboard if root
            const currentHash = hash || '#dashboard';

            links.forEach(link => {
                const href = link.getAttribute('href');

                let isActive = false;
                if (href === '#dashboard' && (currentHash === '' || currentHash === '#dashboard')) {
                    isActive = true;
                } else if (href !== '#dashboard' && currentHash.startsWith(href)) {
                    isActive = true;
                }

                if (isActive) {
                    link.classList.add('bg-primary-50', 'dark:bg-gray-700', 'text-primary-600', 'dark:text-white');
                    link.classList.remove('text-gray-700', 'dark:text-gray-300');
                    const icon = link.querySelector('i');
                    if(icon) {
                        icon.classList.remove('text-gray-400');
                        icon.classList.add('text-primary-500', 'dark:text-primary-400');
                    }
                } else {
                     link.classList.remove('bg-primary-50', 'dark:bg-gray-700', 'text-primary-600', 'dark:text-white');
                     link.classList.add('text-gray-700', 'dark:text-gray-300');
                     const icon = link.querySelector('i');
                     if(icon) {
                        icon.classList.add('text-gray-400');
                        icon.classList.remove('text-primary-500', 'dark:text-primary-400');
                    }
                }
            });
        }
    }
};
