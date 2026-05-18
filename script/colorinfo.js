 function color_info_maker() {
    return `<table>
                <tr>
                    <td><span class="square-ref white"></span></td>
                    <td>Ignored</td>
                    <td><span class="square-ref gray"></span></td>
                    <td>Absent</td>
                </tr>
                <tr>
                    <td><span class="square-ref green"></span></td>
                    <td>Correct</td>
                    <td><span class="square-ref dark-green"></span></td>
                    <td>Correct (wrong diacritic)</td>
                </tr>
                <tr>
                    <td><span class="square-ref yellow"></span></td>
                    <td>Present</td>
                    <td><span class="square-ref dark-yellow"></span></td>
                    <td>Present (wrong diacritic)</td>
                </tr>
            </table>`;
};

// generates the color information table for the game and inserts it into the page
document.addEventListener("DOMContentLoaded", () => {
    const infoElement = document.getElementById('color-info');
    if (infoElement) {
        infoElement.innerHTML = color_info_maker();
    }
});
