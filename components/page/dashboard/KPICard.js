// src/components/KPICard.js
import React from 'react';
import { Card, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { 
    Cart4, 
    GraphUpArrow, 
    ExclamationCircle,
    ArrowUpShort,
    ArrowDownShort,
    InfoCircle
} from 'react-bootstrap-icons';
import { MdOutlineCurrencyRupee } from "react-icons/md";

// Enhanced color palette
const colors = {
    primary: '#0d6efd',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    muted: '#6c757d'
};

// Icon Rendering Function
const renderIcon = (icon, color) => {
    const iconComponents = {
        RupeeIcon: () => (
            <div className="rounded-circle p-3 mb-3" style={{ backgroundColor: `${colors[color]}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdOutlineCurrencyRupee size={24} color={colors[color]} />
            </div>
        ),
        Cart4: () => (
            <div className="rounded-circle p-3 mb-3" style={{ backgroundColor: `${colors[color]}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cart4 size={24} color={colors[color]} />
            </div>
        ),
        GraphUpArrow: () => (
            <div className="rounded-circle p-3 mb-3" style={{ backgroundColor: `${colors[color]}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraphUpArrow size={24} color={colors[color]} />
            </div>
        ),
        ExclamationCircle: () => (
            <div className="rounded-circle p-3 mb-3" style={{ backgroundColor: `${colors[color]}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExclamationCircle size={24} color={colors[color]} />
            </div>
        )
    };

    return iconComponents[icon] ? iconComponents[icon]() : null;
};

// Tooltip Content
const renderTooltip = (context) => (
    <Tooltip id="button-tooltip" {...context}>
        {context.props['data-tip']}
    </Tooltip>
);

// KPICard Component
const KPICard = ({ title, value, icon, color, trend, trendValue, tooltip }) => (
    <Card 
        className="h-100 shadow-sm border-0"
        style={{ 
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)';
        }}
    >
        <Card.Body className="p-4 d-flex flex-column">
            {/* Icon */}
            {renderIcon(icon, color)}
            
            {/* Title with Tooltip */}
            <div className="d-flex align-items-center mb-2">
                <h6 className="mb-0 me-2" style={{ fontSize: '0.9rem', fontWeight: '500', color: colors.muted }}>
                    {title}
                </h6>
                {tooltip && (
                    <OverlayTrigger
                        placement="top"
                        overlay={renderTooltip({ props: { 'data-tip': tooltip } })}
                    >
                        <InfoCircle size={16} color={colors.muted} style={{ cursor: 'pointer' }} />
                    </OverlayTrigger>
                )}
            </div>
            
            {/* Value */}
            <h2 className="mb-3 fw-bold" style={{ color: colors[color], fontSize: '1.5rem' }}>
                {value || 0}
            </h2>
            
            {/* Trend */}
            {trend && (
                <div className="d-flex align-items-center">
                    <Badge 
                        bg={trend === 'up' ? 'success' : 'danger'} 
                        className="d-flex align-items-center gap-1 px-2 py-1"
                        style={{ fontSize: '0.8rem' }}
                    >
                        {trend === 'up' ? 
                            <ArrowUpShort size={16} /> : 
                            <ArrowDownShort size={16} />
                        }
                        {trendValue}%
                    </Badge>
                    <span className="ms-2 text-muted" style={{ fontSize: '0.8rem' }}>
                        Compared to last period
                    </span>
                </div>
            )}
        </Card.Body>
    </Card>
);

export default KPICard;
