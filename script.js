class UPVCCalculator {
    constructor() {
        this.rates = {
            profile: {
                '60': 650,
                '70': 950,
                '80': 1350
            },
            colorMultiplier: {
                'white': 1.0,
                'golden-oak': 1.30,
                'dark-oak': 1.30,
                'anthracite': 1.35
            },
            glass: {
                'single': 900,
                'double': 1800,
                'double-lowe': 2400
            },
            hardware: {
                'fixed': 0,
                'casement': 1800,
                'tilt-turn': 2800,
                'sliding': 2200
            },
            heavyHardwareAddon: 800
        };

        this.initDOMReferences();
        this.attachEventListeners();
        this.update();
    }

    initDOMReferences() {
        this.inputs = {
            width: document.getElementById('width'),
            height: document.getElementById('height'),
            sections: document.getElementById('sections'),
            openType: document.getElementById('openType'),
            profileSeries: document.getElementById('profileSeries'),
            color: document.getElementById('color'),
            glassType: document.getElementById('glassType'),
            hardware: document.getElementById('hardware')
        };

        this.outputs = {
            totalPrice: document.getElementById('totalPrice'),
            bomProfile: document.getElementById('bomProfile'),
            bomGlass: document.getElementById('bomGlass'),
            costProfile: document.getElementById('costProfile'),
            costGlass: document.getElementById('costGlass'),
            costHardware: document.getElementById('costHardware'),
            canvas: document.getElementById('windowCanvas')
        };
    }

    attachEventListeners() {
        Object.values(this.inputs).forEach(input => {
            input.addEventListener('input', () => this.update());
        });
    }

    calculateMetrics() {
        const w = parseFloat(this.inputs.width.value) / 1000;
        const h = parseFloat(this.inputs.height.value) / 1000;
        const n = parseInt(this.inputs.sections.value);

        const outerPerimeter = (2 * w) + (2 * h);
        const mullionLength = (n - 1) * h;
        const totalProfileMeters = outerPerimeter + mullionLength;

        const glassArea = Math.max(0, (w - (0.06 * (n + 1))) * (h - 0.12));

        const baseProfileRate = this.rates.profile[this.inputs.profileSeries.value];
        const colorMult = this.rates.colorMultiplier[this.inputs.color.value];
        const profileCost = totalProfileMeters * baseProfileRate * colorMult;

        const glassRate = this.rates.glass[this.inputs.glassType.value];
        const glassCost = glassArea * glassRate;

        let hwCost = (this.rates.hardware[this.inputs.openType.value] || 0) * n;
        if (this.inputs.hardware.value === 'heavy' && this.inputs.openType.value !== 'fixed') {
            hwCost += this.rates.heavyHardwareAddon * n;
        }

        const totalCost = profileCost + glassCost + hwCost;

        return { totalProfileMeters, glassArea, profileCost, glassCost, hwCost, totalCost, w, h, n };
    }

    renderSVG({ w, h, n }) {
        const openType = this.inputs.openType.value;
        const canvas = this.outputs.canvas;
        canvas.innerHTML = '';

        const strokeColor = '#333333';
        const glassColor = 'rgba(59, 130, 246, 0.15)';

        const pad = 20;
        const svgW = 360;
        const svgH = 240;

        let renderW = svgW - (pad * 2);
        let renderH = svgH - (pad * 2);

        const aspect = w / h;
        if (aspect > (renderW / renderH)) {
            renderH = renderW / aspect;
        } else {
            renderW = renderH * aspect;
        }

        const x0 = (svgW - renderW) / 2;
        const y0 = (svgH - renderH) / 2;
        const secWidth = renderW / n;

        const frame = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        frame.setAttribute('x', x0);
        frame.setAttribute('y', y0);
        frame.setAttribute('width', renderW);
        frame.setAttribute('height', renderH);
        frame.setAttribute('fill', '#1e1e1e');
        frame.setAttribute('stroke', strokeColor);
        frame.setAttribute('stroke-width', '6');
        canvas.appendChild(frame);

        for (let i = 0; i < n; i++) {
            const px = x0 + (i * secWidth);

            const pane = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            pane.setAttribute('x', px + 4);
            pane.setAttribute('y', y0 + 4);
            pane.setAttribute('width', secWidth - 8);
            pane.setAttribute('height', renderH - 8);
            pane.setAttribute('fill', glassColor);
            pane.setAttribute('stroke', strokeColor);
            pane.setAttribute('stroke-width', '2');
            canvas.appendChild(pane);

            if (openType === 'casement' || openType === 'tilt-turn') {
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const cx = px + 4;
                const cy = y0 + 4;
                const cw = secWidth - 8;
                const ch = renderH - 8;

                const d = `M ${cx} ${cy} L ${cx + cw} ${cy + (ch / 2)} L ${cx} ${cy + ch}`;
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', '#3b82f6');
                path.setAttribute('stroke-width', '1.5');
                path.setAttribute('stroke-dasharray', '4 4');
                canvas.appendChild(path);
            }
        }
    }

    update() {
        const data = this.calculateMetrics();

        this.outputs.totalPrice.textContent = `EGP ${data.totalCost.toFixed(2)}`;
        this.outputs.bomProfile.textContent = `${data.totalProfileMeters.toFixed(2)} m`;
        this.outputs.bomGlass.textContent = `${data.glassArea.toFixed(2)} m²`;
        this.outputs.costProfile.textContent = `EGP ${data.profileCost.toFixed(2)}`;
        this.outputs.costGlass.textContent = `EGP ${data.glassCost.toFixed(2)}`;
        this.outputs.costHardware.textContent = `EGP ${data.hwCost.toFixed(2)}`;

        this.renderSVG(data);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('year').textContent = new Date().getFullYear();
    new UPVCCalculator();
});
