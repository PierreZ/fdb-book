// Populate the sidebar
//
// This is a script, and not included directly in the page, to control the total size of the book.
// The TOC contains an entry for each page, so if each page includes a copy of the TOC,
// the total size of the page becomes O(n**2).
class MDBookSidebarScrollbox extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        this.innerHTML = '<ol class="chapter"><li class="chapter-item expanded "><a href="welcome.html"><strong aria-hidden="true">1.</strong> Welcome</a></li><li class="chapter-item expanded "><a href="meet_fdb/index.html"><strong aria-hidden="true">2.</strong> Meet FoundationDB</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="meet_fdb/enter_fdb.html"><strong aria-hidden="true">2.1.</strong> Enter FoundationDB</a></li><li class="chapter-item expanded "><a href="meet_fdb/another_db.html"><strong aria-hidden="true">2.2.</strong> Another DB?</a></li><li class="chapter-item expanded "><a href="meet_fdb/everything_is_kv.html"><strong aria-hidden="true">2.3.</strong> Everything is a Key-Value</a></li><li class="chapter-item expanded "><a href="meet_fdb/correctness.html"><strong aria-hidden="true">2.4.</strong> Correctness</a></li></ol></li><li class="chapter-item expanded "><a href="getting_started/installation.html"><strong aria-hidden="true">3.</strong> Getting Started</a></li><li class="chapter-item expanded "><a href="develop_layer/index.html"><strong aria-hidden="true">4.</strong> Develop on FoundationDB</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="develop_layer/crafting-row-keys.html"><strong aria-hidden="true">4.1.</strong> Crafting Row Keys</a></li><li class="chapter-item expanded "><a href="develop_layer/storing-structured-data.html"><strong aria-hidden="true">4.2.</strong> Storing Structured Data</a></li><li class="chapter-item expanded "><a href="develop_layer/studiable-layers.html"><strong aria-hidden="true">4.3.</strong> Studiable Layers</a></li><li class="chapter-item expanded "><a href="develop_layer/tips.html"><strong aria-hidden="true">4.4.</strong> Tips</a></li></ol></li><li class="chapter-item expanded "><a href="operate_fdb/index.html"><strong aria-hidden="true">5.</strong> Operate FoundationDB</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="operate_fdb/roles.html"><strong aria-hidden="true">5.1.</strong> Roles</a></li><li class="chapter-item expanded "><a href="operate_fdb/choosing-coordinators.html"><strong aria-hidden="true">5.2.</strong> Choosing Coordinators</a></li><li class="chapter-item expanded "><a href="operate_fdb/upgrading.html"><strong aria-hidden="true">5.3.</strong> Upgrading FoundationDB</a></li><li class="chapter-item expanded "><a href="operate_fdb/data-distribution.html"><strong aria-hidden="true">5.4.</strong> Data Distribution</a></li></ol></li><li class="chapter-item expanded "><a href="the-record-layer/index.html"><strong aria-hidden="true">6.</strong> The Record Layer</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="the-record-layer/what-is-record-layer.html"><strong aria-hidden="true">6.1.</strong> What is the Record-layer?</a></li><li class="chapter-item expanded "><a href="the-record-layer/quick.html"><strong aria-hidden="true">6.2.</strong> QuiCK</a></li></ol></li><li class="chapter-item expanded "><a href="internals/index.html"><strong aria-hidden="true">7.</strong> Internals</a></li><li><ol class="section"><li class="chapter-item expanded "><a href="internals/the-write-path.html"><strong aria-hidden="true">7.1.</strong> The Write Path</a></li><li class="chapter-item expanded "><a href="internals/the-read-path.html"><strong aria-hidden="true">7.2.</strong> The Read Path</a></li></ol></li></ol>';
        // Set the current, active page, and reveal it if it's hidden
        let current_page = document.location.href.toString().split("#")[0].split("?")[0];
        if (current_page.endsWith("/")) {
            current_page += "index.html";
        }
        var links = Array.prototype.slice.call(this.querySelectorAll("a"));
        var l = links.length;
        for (var i = 0; i < l; ++i) {
            var link = links[i];
            var href = link.getAttribute("href");
            if (href && !href.startsWith("#") && !/^(?:[a-z+]+:)?\/\//.test(href)) {
                link.href = path_to_root + href;
            }
            // The "index" page is supposed to alias the first chapter in the book.
            if (link.href === current_page || (i === 0 && path_to_root === "" && current_page.endsWith("/index.html"))) {
                link.classList.add("active");
                var parent = link.parentElement;
                if (parent && parent.classList.contains("chapter-item")) {
                    parent.classList.add("expanded");
                }
                while (parent) {
                    if (parent.tagName === "LI" && parent.previousElementSibling) {
                        if (parent.previousElementSibling.classList.contains("chapter-item")) {
                            parent.previousElementSibling.classList.add("expanded");
                        }
                    }
                    parent = parent.parentElement;
                }
            }
        }
        // Track and set sidebar scroll position
        this.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                sessionStorage.setItem('sidebar-scroll', this.scrollTop);
            }
        }, { passive: true });
        var sidebarScrollTop = sessionStorage.getItem('sidebar-scroll');
        sessionStorage.removeItem('sidebar-scroll');
        if (sidebarScrollTop) {
            // preserve sidebar scroll position when navigating via links within sidebar
            this.scrollTop = sidebarScrollTop;
        } else {
            // scroll sidebar to current active section when navigating via "next/previous chapter" buttons
            var activeSection = document.querySelector('#sidebar .active');
            if (activeSection) {
                activeSection.scrollIntoView({ block: 'center' });
            }
        }
        // Toggle buttons
        var sidebarAnchorToggles = document.querySelectorAll('#sidebar a.toggle');
        function toggleSection(ev) {
            ev.currentTarget.parentElement.classList.toggle('expanded');
        }
        Array.from(sidebarAnchorToggles).forEach(function (el) {
            el.addEventListener('click', toggleSection);
        });
    }
}
window.customElements.define("mdbook-sidebar-scrollbox", MDBookSidebarScrollbox);
