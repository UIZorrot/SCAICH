import React from "react";
import { Button, Tooltip } from "antd";
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, EditOutlined } from "@ant-design/icons";
import "./BlockNodeActions.css";

const BlockNodeActions = ({ 
  onDelete, 
  onMoveUp, 
  onMoveDown, 
  onEdit, 
  showEdit = true,
  editTooltip = "编辑",
  className = "" 
}) => {
  return (
    <div className={`block-node-actions ${className}`}>
      <div className="actions-container">
        <Tooltip title="上移">
          <Button 
            size="small" 
            type="text" 
            icon={<ArrowUpOutlined />} 
            onClick={onMoveUp}
            className="action-btn move-up"
          />
        </Tooltip>
        
        <Tooltip title="下移">
          <Button 
            size="small" 
            type="text" 
            icon={<ArrowDownOutlined />} 
            onClick={onMoveDown}
            className="action-btn move-down"
          />
        </Tooltip>
        
        {showEdit && (
          <Tooltip title={editTooltip}>
            <Button 
              size="small" 
              type="text" 
              icon={<EditOutlined />} 
              onClick={onEdit}
              className="action-btn edit"
            />
          </Tooltip>
        )}
        
        <Tooltip title="删除">
          <Button 
            size="small" 
            type="text" 
            icon={<DeleteOutlined />} 
            onClick={onDelete}
            className="action-btn delete"
            danger
          />
        </Tooltip>
      </div>
    </div>
  );
};

export default BlockNodeActions;
